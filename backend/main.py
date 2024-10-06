from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import os
import openai
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configura le origini consentite
origins = [
    "http://localhost:5173",  # Aggiungi l'URL del tuo front-end
    # Puoi aggiungere altre origini se necessario
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specifica le origini consentite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Modelli per le richieste
class Message(BaseModel):
    role: str
    content: str

class ConversationRequest(BaseModel):
    conversation: list[Message]

class InitialRequest(BaseModel):
    initialResponses: dict

# Endpoint per iniziare la conversazione
@app.post("/start_conversation")
async def start_conversation(
    initialResponses: str = Form(...),
    ideaFile: UploadFile = File(None)
):
    initial_responses = json.loads(initialResponses)

    # Gestione del file caricato
    if ideaFile:
        contents = await ideaFile.read()
        file_location = f"uploads/{ideaFile.filename}"
        os.makedirs(os.path.dirname(file_location), exist_ok=True)
        with open(file_location, "wb") as f:
            f.write(contents)
        initial_responses['ideaFilePath'] = file_location

    # Messaggio di sistema per l'AI
    system_message = {
        "role": "system",
        "content": (
            "Sei un assistente che pone domande per raccogliere informazioni necessarie a creare "
            "un piano d'azione per un progetto di design o sviluppo. Basati sulle risposte iniziali "
            "dell'utente per formulare la prossima domanda."
        )
    }

    # Includi le risposte iniziali nel messaggio
    user_message = {
        "role": "user",
        "content": f"Ecco le mie risposte iniziali: {json.dumps(initial_responses)}"
    }

    messages = [system_message, user_message]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150,
            temperature=0.7,
        )
        next_question = response.choices[0].message['content'].strip()
    except Exception as e:
        print(f"Errore nella chiamata all'API di OpenAI: {e}")
        return {"message": "Errore nella generazione della domanda successiva"}

    return {"next_question": next_question}

# Endpoint per ricevere le risposte dell'utente e generare la prossima domanda
@app.post("/next_question")
async def get_next_question(conversation_request: ConversationRequest):
    conversation = conversation_request.conversation

    # Messaggio di sistema per l'AI
    system_message = {
        "role": "system",
        "content": (
            "Sei un assistente che pone domande per raccogliere informazioni necessarie a creare "
            "un piano d'azione per un progetto di design o sviluppo. Fai una domanda alla volta, "
            "basandoti sulle risposte precedenti dell'utente. Le tue domande devono essere pertinenti e semplici da rispondere per un utente che non necessariamente ha conoscenze tecniche specifiche"
            "e mirate a raccogliere informazioni utili."
        )
    }

    # Costruisci i messaggi per l'API
    messages = [system_message] + [message.dict() for message in conversation]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=150,
            temperature=0.7,
        )
        next_question = response.choices[0].message['content'].strip()
    except Exception as e:
        print(f"Errore nella chiamata all'API di OpenAI: {e}")
        return {"message": "Errore nella generazione della domanda successiva"}

    return {"next_question": next_question}

# Endpoint per generare il piano d'azione finale
@app.post("/generate_plan")
async def generate_action_plan(conversation_request: ConversationRequest):
    conversation = conversation_request.conversation

    # Messaggio di sistema per l'AI
    system_message = {
        "role": "system",
        "content": (
            "Sei un esperto di progetti di design e sviluppo. Sulla base della seguente conversazione, "
            "genera un piano d'azione dettagliato che includa i passi necessari per completare il progetto, "
            "i tempi stimati e le risorse richieste."
        )
    }

    messages = [system_message] + [message.dict() for message in conversation]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        action_plan = response.choices[0].message['content'].strip()
    except Exception as e:
        print(f"Errore nella chiamata all'API di OpenAI: {e}")
        return {"message": "Errore nella generazione del piano d'azione"}

    return {"action_plan": action_plan}
