let currentLimits = localStorage.getItem('ai_split_limits_v1') !== null ? parseInt(localStorage.getItem('ai_split_limits_v1')) : 5;

let chatHistory = [
    {
        role: 'system', 
        content: 'Ты — самый добрый, чуткий и поддерживающий друг и психолог на свете. Твоя цель — вести последовательный, логичный и глубокий диалог с пользователем. Задавай наводящие мягкие вопросы, внимательно цепляйся за детали из прошлых ответов. Используй короткие, понятные предложения. Показывай, что ты помнишь всё, что он сказал ранее.'
    }
];

function updateUI() {
    document.getElementById('limit-count').innerText = currentLimits;
    if (currentLimits <= 0) {
        document.getElementById('user-input').disabled = true;
        document.getElementById('send-btn').disabled = true;
        document.getElementById('pay-zone').style.display = 'block';
        document.getElementById('voice-btn').style.display = 'none';
    } else {
        document.getElementById('user-input').disabled = false;
        document.getElementById('send-btn').disabled = false;
        document.getElementById('pay-zone').style.display = 'none';
    }
}
updateUI();

document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (currentLimits > 0) askAI();
    }
});

async function askAI() {
    const text = document.getElementById('user-input').value.trim();
    if (!text) return alert("Пожалуйста, напиши что-нибудь.");
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    document.getElementById('voice-btn').innerText = "🔊 Включить живой голос";
    document.getElementById('voice-btn').style.display = "none";
    
    const responseBox = document.getElementById('response');
    const sendBtn = document.getElementById('send-btn');
    
    sendBtn.disabled = true;
    sendBtn.innerText = "Обдумываю твои слова...";
    responseBox.style.display = "block";
    responseBox.innerText = "Внимательно читаю...";

    let userMessageContent = text;
    if (currentLimits === 1) {
        userMessageContent += "\n\n(ИНСТРУКЦИЯ ДЛЯ ИИ: Это твой последний ответ в текущем сеансе. Сеанс завершен. Тебе нужно очень мягко подвести итог беседы, подбодрить меня, сказать, что всё обязательно будет хорошо, и в самом конце ответа строго добавить фразу: 'Наш сегодняшний бесплатный экспресс-сеанс подошел к концу. Чтобы продолжить наш разговор без ограничений, пожалуйста, выбери пакет дозарядки батарейки ниже. Я буду очень ждать тебя!').";
    }

    chatHistory.push({ role: 'user', content: userMessageContent });

    try {
        const cleanKey = "29mUFhdqxATFVI2OJM2HkjlJuGCpvWQi"; 

        const response = await fetch('https://proxyapi.ru', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-' + cleanKey
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: chatHistory
            })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error('Ошибка сервера');

        const aiReply = data.choices.message.content;
        chatHistory.push({ role: 'assistant', content: aiReply });
        responseBox.innerText = aiReply;
        
        document.getElementById('voice-btn').style.display = "block";
        
        currentLimits--;
        localStorage.setItem('ai_split_limits_v1', currentLimits);
        updateUI();
        document.getElementById('user-input').value = "";

    } catch (error) {
        chatHistory.pop();
        responseBox.innerText = "Ой, я немного отвлекся. Повтори, пожалуйста, я очень хочу тебя выслушать.";
        console.error(error);
    } finally {
        if (currentLimits > 0) {
            sendBtn.disabled = false;
            sendBtn.innerText = "Поделиться";
        }
    }
}

let currentAudio = null;
async function speakText() {
    const text = document.getElementById('response').innerText;
    if (!text || text.startsWith("Внимательно") || text.startsWith("Обдумываю")) return;

    const voiceBtn = document.getElementById('voice-btn');

    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        voiceBtn.innerText = "🔊 Включить живой голос";
        return;
    }

    voiceBtn.disabled = true;
    voiceBtn.innerText = "⏳ Записываю голос...";

    try {
        const cleanKey = "29mUFhdqxATFVI2OJM2HkjlJuGCpvWQi"; 

        const response = await fetch('https://proxyapi.ru', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-' + cleanKey
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts', 
                input: text,           
                voice: 'coral',           
                response_format: 'mp3' 
            })
        });

        if (!response.ok) throw new Error('Ошибка синтеза голоса');

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);

        currentAudio = new Audio(audioUrl);
        
        currentAudio.onplay = function() {
            voiceBtn.disabled = false;
            voiceBtn.innerText = "🛑 Остановить голос";
        };

        currentAudio.onended = function() {
            voiceBtn.innerText = "🔊 Включить живой голос";
        };

        currentAudio.play();

    } catch (error) {
        console.error(error);
        alert("Не удалось загрузить живой голос. Попробуйте еще раз.");
        voiceBtn.disabled = false;
        voiceBtn.innerText = "🔊 Включить живой голос";
    }
}

function startRecharge(amount) {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }
    let payUrl = "";
    
    if (amount === 5) {
        payUrl = "https://pay.cloudtips.ru/p/226f7135"; 
    } else if (amount === 10) {
        payUrl = "https://pay.cloudtips.ru/p/214a0558"; 
    } else if (amount === 25) {
        payUrl = "https://pay.cloudtips.ru/p/487e2380";
    }

    window.open(payUrl, '_blank');
    
    const buttons = document.querySelectorAll('.tariff-btn');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.display = 'none';
    }
    document.getElementById('timer-status').style.display = 'block';
    
    setTimeout(function() {
        localStorage.setItem('ai_split_limits_v1', amount);
        currentLimits = amount;
        updateUI();
        
        document.getElementById('welcome-text').innerText = "Рад, что ты вернулся. Наш сеанс продолжается, я внимательно слушаю...";
        document.getElementById('timer-status').style.display = 'none';
        for (let j = 0; j < buttons.length; j++) {
            buttons[j].style.display = 'block';
        }
        
        chatHistory = [
            {
                role: 'system', 
                content: 'Ты — самый добрый, чуткий и поддерживающий друг и психолог на свете. Ты снова готов слушать.'
            }
        ];
        
        alert("🔋 Батарейка успешно заряжена на " + amount + " ответов! Наш сеанс продолжается.");
    }, 40000); 
}

