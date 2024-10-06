import React, { useState } from 'react';
import axios from 'axios';

// Se stai utilizzando immagini locali, importale qui
// import serifFontImage from '../assets/serif-font.png';
// import sansSerifFontImage from '../assets/sans-serif-font.png';

function DynamicForm() {
  const [step, setStep] = useState(1);
  const [userResponses, setUserResponses] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [actionPlan, setActionPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gestione del cambio di step e aggiornamento delle risposte
  const handleNext = (key, value) => {
    setUserResponses(prev => ({ ...prev, [key]: value }));
    setStep(step + 1);
  };

  // Gestione del file caricato
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUserResponses(prev => ({ ...prev, 'ideaFile': event.target.files[0] }));
  };

  // Inizio delle domande dinamiche generate dall'AI
  const startDynamicQuestions = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('initialResponses', JSON.stringify(userResponses));
  
    if (userResponses.ideaFile) {
      formData.append('ideaFile', userResponses.ideaFile);
    }
  
    try {
      const response = await axios.post('http://localhost:8000/start_conversation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const firstQuestion = response.data.next_question;
      setConversation([{ role: 'assistant', content: firstQuestion }]);
      setStep(step + 1);
    } catch (error) {
      console.error("Errore durante l'inizio della conversazione:", error);
      alert("Si è verificato un errore. Per favore, riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Invia la risposta dell'utente e riceve la prossima domanda dall'AI
  const sendMessage = async () => {
    if (!userInput.trim()) return;
  
    const updatedConversation = [
      ...conversation,
      { role: 'user', content: userInput }
    ];
  
    setConversation(updatedConversation);
    setUserInput('');
    setIsLoading(true);
  
    try {
      const response = await axios.post('http://localhost:8000/next_question', {
        conversation: updatedConversation,
      });
      const assistantMessage = response.data.next_question;
  
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: assistantMessage }
      ]);
    } catch (error) {
      console.error('Errore durante la richiesta:', error);
      alert('Si è verificato un errore. Per favore, riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Genera il piano d'azione finale
  const generateActionPlan = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/generate_plan', {
        conversation: conversation,
      });
      const plan = response.data.action_plan;
      setActionPlan(plan);
    } catch (error) {
      console.error('Errore durante la generazione del piano d\'azione:', error);
      alert('Si è verificato un errore. Per favore, riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };  

  // Renderizza le domande statiche e dinamiche in base allo step corrente
  const renderQuestion = () => {
    if (actionPlan) {
      // Mostra il piano d'azione finale
      return (
        <div>
          <h2>Piano d'Azione Generato:</h2>
          <p>{actionPlan}</p>
        </div>
      );
    } else if (step <= 3) {
      // Fase delle domande statiche
      switch (step) {
        case 1:
          return (
            <div>
              <h2>Che tipo di servizio stai cercando?</h2>
              <button onClick={() => handleNext('serviceType', 'Logo Design')}>Logo Design</button>
              <button onClick={() => handleNext('serviceType', 'Sito Web')}>Sito Web</button>
              <button onClick={() => handleNext('serviceType', 'E-commerce')}>E-commerce</button>
              <button onClick={() => handleNext('serviceType', 'App')}>App</button>
            </div>
          );
        case 2:
          if (userResponses.serviceType === 'Logo Design') {
            return (
              <div>
                <h2>Logo nuovo o Restyling?</h2>
                <button onClick={() => handleNext('logoOption', 'Logo nuovo')}>Logo nuovo</button>
                <button onClick={() => handleNext('logoOption', 'Restyling')}>Restyling</button>
              </div>
            );
          } else {
            // Puoi gestire altre opzioni per altri servizi qui
            return (
              <div>
                <h2>Descrivi brevemente ciò di cui hai bisogno:</h2>
                <textarea
                  placeholder="Descrizione del progetto"
                  onChange={(e) => setUserResponses(prev => ({ ...prev, 'projectDescription': e.target.value }))}
                ></textarea>
                <button onClick={() => setStep(step + 1)}>Avanti</button>
              </div>
            );
          }
        case 3:
          return (
            <div>
              <h2>Hai già alcune idee?</h2>
              <textarea
                placeholder="Descrivi le tue idee (opzionale)"
                onChange={(e) => setUserResponses(prev => ({ ...prev, 'ideaDescription': e.target.value }))}
              ></textarea>
              <input type="file" onChange={handleFileChange} />
              <button onClick={() => setStep(step + 1)}>Avanti</button>
            </div>
          );
        default:
          return null;
      }
    } else if (step === 4) {
      // Inizia la conversazione dinamica
      return (
        <div>
          <button onClick={startDynamicQuestions}>Inizia le domande</button>
        </div>
      );
    } else {
      // Fase delle domande dinamiche generate dall'AI
      return (
        <div>
          <div className="conversation">
            {conversation.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <p><strong>{message.role === 'user' ? 'Tu' : 'Assistente'}:</strong> {message.content}</p>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Scrivi la tua risposta..."
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            Invia
          </button>
          <button onClick={generateActionPlan} disabled={conversation.length < 3 || isLoading}>
            Genera Piano d'Azione
          </button>
          {isLoading && <p>Caricamento...</p>}
        </div>
      );
    }
  };

  return (
    <div className="dynamic-form">
      {renderQuestion()}
    </div>
  );
}

export default DynamicForm;
