###########################
########### EC2 ###########
###########################
output "ec2_public_ipv4" {
  value = aws_instance.booksmart_backend.public_ip
}
