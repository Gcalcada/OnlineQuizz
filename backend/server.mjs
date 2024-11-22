import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

// Criação do servidor HTTP
const server = http.createServer();

// Configuração do Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Apenas aceitar conexões dessa origem (frontend)
    }
});

// Ler as perguntas do quiz a partir do JSON
let quizData;
try {
    quizData = JSON.parse(fs.readFileSync('./public/quiz-data.json', 'utf-8')); // Lê o arquivo JSON (verifique o caminho)
} catch (error) {
    console.error("Erro ao ler o arquivo JSON:", error);
    process.exit(1); // Se o arquivo não for lido corretamente, o servidor para
}

// Quando um cliente se conecta
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Inicializa o número de vidas para o jogador
    let lives = 3;
    let currentIndex = 0;

    // Envia as perguntas ao cliente quando o quiz começa
    socket.emit('quiz-started', { questions: quizData });

    // Enviar a primeira pergunta ao jogador
    socket.emit('next-question', {
        question: quizData[currentIndex],
        questionIndex: currentIndex
    });

    // Lidar com o envio de respostas
    socket.on('answer', (data) => {
        console.log('Resposta recebida:', data);

        const currentQuestion = quizData[data.questionIndex]; // Pega a pergunta atual
        const isCorrect = data.answer === currentQuestion.answer; // Compara a resposta

        // Se a resposta estiver errada, subtrai uma vida
        if (!isCorrect) {
            lives -= 1;
            if (lives > 0) {
                socket.emit('answer-feedback', {
                    message: `Resposta errada. Você tem ${lives} vidas restantes.`,
                    isCorrect: false
                });
            } else {
                socket.emit('game-over', { message: 'Você perdeu todas as vidas. O jogo será reiniciado.' });
                lives = 3; // Reinicia as vidas
                currentIndex = 0; // Reinicia a pergunta
                socket.emit('next-question', { question: quizData[currentIndex], questionIndex: currentIndex });
            }
        } else {
            // Se a resposta estiver correta, envia feedback positivo
            socket.emit('answer-feedback', {
                message: 'Resposta correta! Boa!',
                isCorrect: true
            });

            // Envia a próxima pergunta se houver
            if (currentIndex + 1 < quizData.length) {
                currentIndex += 1;
                socket.emit('next-question', {
                    question: quizData[currentIndex],
                    questionIndex: currentIndex
                });
            } else {
                socket.emit('quiz-finished', { message: 'Quiz terminado!' });
            }
        }
    });

    // Lidar com a solicitação de próxima pergunta
    socket.on('next-question', (data) => {
        if (currentIndex + 1 < quizData.length) {
            currentIndex += 1;
            socket.emit('next-question', {
                question: quizData[currentIndex],
                questionIndex: currentIndex
            });
        }
    });

    // Lidar com o reinício do jogo
    socket.on('game-over', () => {
        lives = 3;
        currentIndex = 0;
        socket.emit('next-question', { question: quizData[currentIndex], questionIndex: currentIndex });
    });
});

// Iniciar o servidor na porta 3001
server.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});
