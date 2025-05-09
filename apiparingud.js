window.onload = function () {
    const frontForm = document.getElementById("frontform");
    frontForm.addEventListener("submit", handleFormSubmit);

    const otsingForm = document.getElementById("otsinguform");
    otsingForm.addEventListener("submit", handleFormSubmit);

    listiraamatud();
}

// Vormide submiti käitlemine
async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const plainFormData = Object.fromEntries(formData.entries());
    const formDataJsonString = JSON.stringify(plainFormData);

    let url = "";

    if (form.id === "frontform") {
        url = "http://localhost:5000/raamatud/";
    } else if (form.id === "otsinguform") {
        url = "http://localhost:5001/raamatu_otsing/";
    }

    try {
        const responseData = await postJsonData({ url, data: JSON.parse(formDataJsonString) });

        if (form.id === "otsinguform") {
            displayOtsinguTulemused(responseData);
        }

        listiraamatud(); // uuendame raamatute nimekirja

    } catch (error) {
        console.error(error);
    }
}

// POST JSON andmed
async function postJsonData({ url, data }) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

// DELETE päring
async function deleteData(url) {
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

// GET päring
async function getDataAsJson(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

// Raamatute nimekirja kuvamine
async function listiraamatud() {
    const resultElement = document.getElementById("raamatud_result");
    resultElement.innerHTML = "";

    try {
        const responseData = await getDataAsJson("http://localhost:5000/raamatud/");

        for (const raamat of responseData.raamatud) {
            const raamatDiv = document.createElement("div");
            raamatDiv.innerHTML = `
                <a href="http://localhost:5000/raamatud/${raamat}" download="${raamat}.txt">${raamat}.txt</a>
                <form class="raamat-otsing-form" data-raamat-id="${raamat}">
                    <input type="text" name="sone" placeholder="Sisesta sõne..." required>
                    <input type="submit" value="Otsi sellest raamatust">
                </form>
                <button class="kustuta-nupp" data-raamat-id="${raamat}">Kustuta raamat</button>
                <div class="raamat-tulemus"></div>
                <hr/>
            `;
            resultElement.appendChild(raamatDiv);
        }

        // Otsingu vormide ja kustutamise nuppude külge event listenerid
        document.querySelectorAll(".raamat-otsing-form").forEach(form => {
            form.addEventListener("submit", handleSingleRaamatOtsing);
        });

        document.querySelectorAll(".kustuta-nupp").forEach(button => {
            button.addEventListener("click", handleRaamatKustutamine);
        });

    } catch (error) {
        console.error("Tulemuste kuvamine ebaõnnestus:", error);
    }
}

// Üldine otsingu tulemuste kuvamine
function displayOtsinguTulemused(responseData) {
    const resultElement = document.getElementById("tulemus");
    resultElement.innerHTML = "";

    if (responseData.tulemused && responseData.tulemused.length > 0) {
        resultElement.innerHTML = `<h3>Leitud tulemused:</h3><ul>`;
        for (const tulemus of responseData.tulemused) {
            resultElement.innerHTML += `<li>Raamat: ${tulemus.raamatu_id}, Leitud: ${tulemus.leitud}</li>`;
        }
        resultElement.innerHTML += `</ul>`;
    } else {
        resultElement.innerHTML = `<p>Ei leitud mingeid tulemusi.</p>`;
    }
}

// Ühe raamatu sees otsimise käitlemine
async function handleSingleRaamatOtsing(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const raamatId = form.dataset.raamatId;
    const sone = form.querySelector('input[name="sone"]').value;

    const requestData = {
        sone: sone
    };

    try {
        const responseData = await postJsonData({
            url: `http://localhost:5001/raamatu_otsing/${raamatId}`,
            data: requestData
        });

        const tulemusDiv = form.nextElementSibling;
        displaySingleRaamatTulemus(responseData, tulemusDiv);

    } catch (error) {
        console.error(error);
    }
}

// Kuvab ühe raamatu otsingu tulemuse
function displaySingleRaamatTulemus(responseData, container) {
    container.innerHTML = "";

    if (responseData.leitud && responseData.leitud > 0) {
        container.innerHTML = `<p><strong>Leitud:</strong> ${responseData.leitud} korda</p>`;
    } else {
        container.innerHTML = `<p>Sõna ei leitud.</p>`;
    }
}

// Raamatu kustutamise käitlemine
async function handleRaamatKustutamine(event) {
    const button = event.currentTarget;
    const raamatId = button.dataset.raamatId;

    if (!confirm(`Kas oled kindel, et soovid kustutada raamatu ${raamatId}?`)) {
        return;
    }

    try {
        await deleteData(`http://localhost:5000/raamatud/${raamatId}`);
        listiraamatud(); // peale kustutamist värskenda nimekiri
    } catch (error) {
        console.error(error);
    }
}
