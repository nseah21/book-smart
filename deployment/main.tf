###########################
########### VPC ###########
###########################

resource "aws_vpc" "booksmart_vpc" {
  cidr_block       = var.main_vpc_cidr
  instance_tenancy = "default"
  tags = {
    "Name" = "booksmart_vpc"
  }
}

resource "aws_security_group" "booksmart_security_group" {
  name = "allow-all"

  vpc_id = aws_vpc.booksmart_vpc.id

  ingress {
    cidr_blocks = [
      "0.0.0.0/0"
    ]
    from_port = 22
    to_port   = 22
    protocol  = "tcp"
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.booksmart-load-balancer-security-group.id]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_internet_gateway" "booksmart_igw" {
  vpc_id = aws_vpc.booksmart_vpc.id
  tags = {
    "Name" = "booksmart_igw"
  }
}

resource "aws_subnet" "booksmart_public_subnet" {
  vpc_id                  = aws_vpc.booksmart_vpc.id
  cidr_block              = var.public_subnet_range
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = {
    "Name" = "booksmart_public_subnet"
  }
}

resource "aws_subnet" "booksmart_public_subnet_b" {
  vpc_id                  = aws_vpc.booksmart_vpc.id
  cidr_block              = var.public_subnet_b_range
  map_public_ip_on_launch = false
  availability_zone       = "${var.aws_region}b"
  tags = {
    "Name" = "booksmart_public_subnet_b"
  }
}

resource "aws_route_table" "booksmart_public_route_table" {
  vpc_id = aws_vpc.booksmart_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.booksmart_igw.id
  }

  tags = {
    "Name" = "booksmart-public-route-table"
  }
}

resource "aws_route_table_association" "booksmart_public_route_table_association" {
  subnet_id      = aws_subnet.booksmart_public_subnet.id
  route_table_id = aws_route_table.booksmart_public_route_table.id
}

###########################
###### LOAD BALANCER ######
###########################

data "aws_route53_zone" "booksmart_selected_zone" {
  name = var.domain_name
}

resource "aws_acm_certificate" "booksmart_cert" {
  domain_name               = "ec2.${var.domain_name}"
  subject_alternative_names = ["*.ec2.${var.domain_name}"]

  validation_method = "DNS"
}

resource "aws_route53_record" "booksmart_cert_validation_record" {
  for_each = {
    for dvo in aws_acm_certificate.booksmart_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.booksmart_selected_zone.zone_id
}

resource "aws_route53_record" "booksmart_route53_A_record" {
  zone_id = data.aws_route53_zone.booksmart_selected_zone.zone_id
  name    = "ec2.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_lb.booksmart_network_load_balancer.dns_name
    zone_id                = aws_lb.booksmart_network_load_balancer.zone_id
    evaluate_target_health = true
  }
}

resource "aws_acm_certificate_validation" "booksmart_cert_validation" {
  timeouts {
    create = "5m"
  }
  certificate_arn         = aws_acm_certificate.booksmart_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.booksmart_cert_validation_record : record.fqdn]
}

resource "aws_security_group" "booksmart-load-balancer-security-group" {
  description = "Allow incoming connections for load balancer"
  vpc_id      = aws_vpc.booksmart_vpc.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "booksmart_network_load_balancer" {
  name               = "booksmart-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.booksmart-load-balancer-security-group.id]
  subnets            = [aws_subnet.booksmart_public_subnet.id, aws_subnet.booksmart_public_subnet_b.id]
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.booksmart_network_load_balancer.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.booksmart_cert_validation.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.booksmart_target_group.arn
  }
}

resource "aws_lb_target_group" "booksmart_target_group" {
  target_type = "instance"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.booksmart_vpc.id

  health_check {
    enabled             = true
    interval            = 60
    path                = "/api/v1/healthcheck/"
    timeout             = 30
    matcher             = 200
    healthy_threshold   = 5
    unhealthy_threshold = 5
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_alb_target_group_attachment" "booksmart_target_group_attachment" {
  target_group_arn = aws_lb_target_group.booksmart_target_group.arn
  target_id        = aws_instance.booksmart_backend.id
}

###########################
########### EC2 ###########
###########################

resource "aws_instance" "booksmart_backend" {
  ami           = "ami-0f450c0ffd814b623"
  instance_type = "t2.micro"

  user_data = base64encode(templatefile("./user_data.sh", {
    GITHUB_DEPLOY_KEY               = var.github_deploy_key,
    APP_PASSWORD = var.APP_PASSWORD
    EMAIL_SENDER = var.EMAIL_SENDER
    OPENAI_API_KEY = var.OPENAI_API_KEY
  }))

  subnet_id              = aws_subnet.booksmart_public_subnet.id
  vpc_security_group_ids = ["${aws_security_group.booksmart_security_group.id}"]
  key_name               = "booksmart_ec2_key_pair"

}

###########################
######### SSH Key #########
###########################

resource "tls_private_key" "booksmart_rsa" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "booksmart_ec2_key_pair" {
  key_name   = "booksmart_ec2_key_pair"
  public_key = tls_private_key.booksmart_rsa.public_key_openssh
}

resource "local_sensitive_file" "booksmart_rsa_private_key_file" {
  content              = tls_private_key.booksmart_rsa.private_key_pem
  file_permission      = "600"
  directory_permission = "700"
  filename             = "${aws_key_pair.booksmart_ec2_key_pair.key_name}.pem"
}
