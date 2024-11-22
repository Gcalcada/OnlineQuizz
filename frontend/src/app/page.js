"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const HomePage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(""); // Mensagem de feedback
  const [socket, setSocket] = useState(null); // Conexão do socket
  const [lives, setLives] = useState(3); // Contador de vidas
  const [isLocked, setIsLocked] = useState(false); // Impede múltiplas respostas consecutivas
  const [isCorrect, setIsCorrect] = useState(false); // Indica se a resposta foi correta
  const [isGameOver, setIsGameOver] = useState(false); // Indica se o jogo terminou

  useEffect(() => {
    const socketInstance = io("http://localhost:3001");

    setSocket(socketInstance);

    socketInstance.on("quiz-started", (data) => {
      setQuestions(data.questions || []);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendAnswer = (answer) => {
    if (socket && !isLocked) {
      const currentQuestion = questions[currentIndex];

      if (answer === currentQuestion.answer) {
        // Resposta correta
        setFeedback("Parabéns, você acertou!");
        setIsLocked(true); // Bloqueia até clicar no botão "Próxima pergunta"
        setIsCorrect(true);
      } else {
        // Resposta errada
        setLives((prevLives) => prevLives - 1);
        setFeedback("Resposta errada! Tente novamente.");
        if (lives - 1 <= 0) {
          // Fim de jogo
          setFeedback("Fim de jogo! Você perdeu todas as vidas.");
          setIsLocked(true); // Bloqueia interações
          setIsGameOver(true);
          socket.emit("game-over");
        }
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setIsLocked(false);
      setIsCorrect(false);
      setFeedback(""); // Limpa o feedback
      socket.emit("next-question", { questionIndex: currentIndex });
      setCurrentIndex((prevIndex) => prevIndex + 1); // Avança para a próxima pergunta
    } else {
      // Última pergunta respondida, jogo termina
      setFeedback("Parabéns, você completou o quiz!");
      setIsGameOver(true);
      setIsLocked(true);
    }
  };

  const restartGame = () => {
    setLives(3);
    setFeedback("");
    setIsLocked(false);
    setIsCorrect(false);
    setIsGameOver(false);
    setCurrentIndex(0);
    socket.emit("restart-game"); // Reinicia o jogo no servidor
  };

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-50">
        <p className="text-lg text-gray-700">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Quiz Online</h1>

        <div className="mb-4 text-xl text-gray-700">
          Vidas restantes: {lives}
        </div>

        {!isGameOver && (
          <>
            <div className="mb-6">
              <p className="text-xl text-gray-700 text-center">
                {questions[currentIndex].question}
              </p>
            </div>

            <div className="space-y-4">
              {questions[currentIndex].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => sendAnswer(option)}
                  className={`w-full py-3 px-4 text-lg font-medium rounded-lg transition duration-300 ${isLocked ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  disabled={isLocked} // Desabilita botões enquanto bloqueado
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {feedback && (
          <div className="mt-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
            <p>{feedback}</p>
          </div>
        )}

        {isCorrect && !isGameOver && (
          <div className="mt-6 text-center">
            <button
              onClick={nextQuestion}
              className=" w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
            >
              Próxima pergunta
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="mt-6 text-center">
            <button
              onClick={restartGame}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Reiniciar o Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
