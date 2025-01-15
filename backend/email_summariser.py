import os
import tempfile
from dotenv import load_dotenv
from langchain.docstore.document import Document
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Or pass in as param
EMBEDDINGS = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
MODEL_NAME = "gpt-4"  # or "gpt-3.5-turbo", etc.

def get_persist_directory(user_id: str) -> str:
    return f"./chromadb/{user_id}"


def load_file(file) -> list[Document]:
    print("Loading PDF file...")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(file.read())
        temp_file_path = temp_file.name
        print("Temp file path:", temp_file_path)

    loader = PyPDFLoader(temp_file_path)
    docs = loader.load()

    os.remove(temp_file_path)
    return docs


def text_to_documents(text: str) -> list[Document]:
    return [Document(page_content=text)]


def split_documents(docs: list[Document]) -> list[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    return text_splitter.split_documents(docs)

def create_new_vector_store(docs: list[Document], persist_directory: str):
    print("[INFO] Creating a new Chroma store...")
    db = Chroma.from_documents(
        documents=docs,
        embedding=EMBEDDINGS,
        persist_directory=persist_directory,
    )
    return db


def load_existing_vector_store(persist_directory: str) -> Chroma:
    print("[INFO] Loading existing Chroma store...")
    db = Chroma(
        persist_directory=persist_directory,
        embedding_function=EMBEDDINGS
    )
    return db


def update_vector_store(user_id: str, new_docs: list[Document]) -> Chroma:
    persist_directory = get_persist_directory(user_id)
    print(f"[DEBUG] Number of input documents: {len(new_docs)}")
    
    for doc in new_docs:
        print(f"[DEBUG] Document content: {doc.page_content[:100]}...")

    splitted_docs = split_documents(new_docs)
    print(f"[DEBUG] Number of split documents: {len(splitted_docs)}")
    
    if len(splitted_docs) == 0:
        raise ValueError("No content to add to vector store. Check the input documents.")
    
    if not os.path.exists(persist_directory):
        print("[INFO] Creating a new Chroma store...")
        db = create_new_vector_store(splitted_docs, persist_directory)
    else:
        print("[INFO] Updating existing Chroma store...")
        db = load_existing_vector_store(persist_directory)
        db.add_documents(splitted_docs)

    return db

def build_summary_prompt(main_email_content: str, additional_context: str = "", user_instructions: str = "") -> str:
    return f"""
You are an expert email summarizer. Your task is to provide a concise and professional
summary of the main email below, considering any additional context and following the user's instructions.

### Main Email to Summarize
{main_email_content}

### Summary Guidelines
1. Focus on the key points and important details.
2. Include any critical actions or requests mentioned.
3. Incorporate context from previous emails if it helps clarify or provide background.

### User Instructions
{user_instructions}

### Additional Context
{additional_context}

Please provide a well-structured summary.
"""


def summarize_and_update(user_id: str, docs: list[Document], user_instructions: str = "") -> str:
    formatted_new_doc_content = "\n\n".join(doc.page_content for doc in docs)

    # Step 1: Retrieve context from vector store if available
    persist_directory = get_persist_directory(user_id)
    retrieved_context = ""
    if os.path.exists(persist_directory):
        print("[INFO] Using existing vector store for context...")
        db = load_existing_vector_store(persist_directory)
        retriever = db.as_retriever()
        retrieved_docs = retriever.invoke("email summary")
        retrieved_context = "\n\n".join(doc.page_content for doc in retrieved_docs)

    # Step 2: Build the summary prompt
    prompt = build_summary_prompt(
        main_email_content=formatted_new_doc_content,
        additional_context=retrieved_context,
        user_instructions=user_instructions
    )

    # Step 3: Generate summary using LLM
    llm = ChatOpenAI(model_name=MODEL_NAME, openai_api_key=OPENAI_API_KEY)
    summary = llm.invoke(prompt)

    # Step 4: Update vector store with new documents
    print("[INFO] Updating the vector store with new content...")
    update_vector_store(user_id, docs)

    return summary


if __name__ == "__main__":
    user_id = "titima-suthiwan-843"
    filename = "exported-email.pdf"

    user_instructions = "Please give the summary in point form and provide actionable insights."

    # ### Case 1: PDF upload
    with open(filename, "rb") as file:
        docs = load_file(file)
        summary = summarize_and_update(user_id, docs, user_instructions)
        print("\nGenerated Summary from PDF:\n")
        print(summary.content)

    ### Case 2: Manual text input
    email_text = """
    Subject: Important: Module Bidding Process for Exchange Students at Aalto 

Dear Exchange Students,

We are delighted to welcome you to Aalto University! As part of your academic journey here, you are required to bid for your preferred modules for the upcoming semester. Please read this email carefully to ensure a smooth and successful bidding process.

Key Dates and Deadlines
Module Bidding Opens: January 10, 2025, 9:00 AM
Module Bidding Closes: January 14, 2025, 5:00 PM
Results Announcement: January 18, 2025
Appeals and Module Adjustment Period: January 19–23, 2025
Steps to Submit Your Module Bids
Access the Module Bidding System:

Log in to the Student Portal.
Navigate to the “Module Bidding” section under the “Academics” tab.
Select Your Modules:

Review the list of available modules for exchange students.
Note the prerequisites and restrictions for each module.
You can bid for up to 8 modules, but you will only be enrolled in a maximum of 5 modules.
Allocate Your Bidding Points:

You will be given 100 bidding points to allocate across your chosen modules.
Assign points strategically to increase your chances of securing high-demand modules.
Submit Your Bids:

Double-check your selections and points allocation.
Click “Submit” to finalize your bids.
Important Information
Module Popularity: Some modules are highly competitive. Check last year’s bidding trends on the portal for guidance.
Module Timetables: Ensure your selected modules do not have overlapping schedules.
Pre-Approved Modules: If you have any pre-approved modules, these will be automatically allocated and will not require bidding.
Appeals and Adjustments
If you are unsuccessful in securing a desired module, you may submit an appeal during the adjustment period. Appeals will be processed on a first-come, first-served basis and are subject to module availability.

Contact Information
For assistance, please contact:

Module Bidding Helpdesk: [email@example.com] | +1-234-567-890
Academic Advisor for Exchange Students: [advisor@example.com]
We strongly encourage you to bid early to avoid last-minute issues. Best of luck with your module selection, and we look forward to seeing you on campus soon!

Warm regards,
Agnetha Berlusconi
"""
    docs = text_to_documents(email_text)
    summary = summarize_and_update(user_id, docs, user_instructions)
    print("\nGenerated Summary from Text:\n")
    print(summary.content)
