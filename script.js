const form = document.getElementById("auth-form");
const logList = document.getElementById("log");
const summary = document.getElementById("summary");
const resetButton = document.getElementById("reset-log");

const encoder = new TextEncoder();

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function sha256(value) {
    return crypto.subtle.digest("SHA-256", encoder.encode(value));
}

function randomHex(bytes = 16) {
    const randomBytes = new Uint8Array(bytes);
    crypto.getRandomValues(randomBytes);
    return toHex(randomBytes.buffer);
}

function setSummary(status, nonce, response) {
    summary.innerHTML = `
        <div>
            <dt>Стан</dt>
            <dd>${status}</dd>
        </div>
        <div>
            <dt>Nonce</dt>
            <dd>${nonce}</dd>
        </div>
        <div>
            <dt>Demo response</dt>
            <dd>${response}</dd>
        </div>
    `;
}

function renderLog(items) {
    logList.innerHTML = "";

    items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        logList.appendChild(li);
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const userId = String(formData.get("userId") || "").trim();
    const passphrase = String(formData.get("passphrase") || "").trim();

    if (!userId || !passphrase) {
        setSummary("Помилка введення", "не згенеровано", "не обчислено");
        renderLog([
            "Симуляцію зупинено: потрібно заповнити ідентифікатор користувача та локальний секрет."
        ]);
        return;
    }

    const log = [];
    const localSecretHash = toHex(await sha256(passphrase));
    const nonce = randomHex(16);
    const responsePayload = `${userId}:${nonce}:${localSecretHash}`;
    const demoResponse = toHex(await sha256(responsePayload));

    log.push(`1. Отримано локальні вхідні дані для користувача "${userId}".`);
    log.push("2. Локальний секрет не передавався у мережу та не зберігався у репозиторії.");
    log.push(`3. У браузері обчислено SHA-256 від локального секрету: ${localSecretHash}`);
    log.push(`4. Згенеровано одноразовий виклик nonce: ${nonce}`);
    log.push(`5. Сформовано рядок демонстраційної відповіді з userId, nonce та похідним значенням.`);
    log.push(`6. Обчислено demo response: ${demoResponse}`);
    log.push("7. На цьому етапі реальний сервер міг би перевіряти відповідь, але в даному прототипі мережевих дій немає.");

    setSummary("Симуляцію виконано локально", nonce, demoResponse);
    renderLog(log);
});

resetButton.addEventListener("click", () => {
    form.reset();
    setSummary("Очікування запуску симуляції", "ще не згенеровано", "ще не обчислено");
    renderLog(["Журнал буде заповнено після натискання кнопки."]);
});
