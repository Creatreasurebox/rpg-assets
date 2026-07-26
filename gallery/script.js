const USER = "Creatreasurebox";
const REPO = "rpg-assets";
const ROOT = "assets";

const gallery = document.getElementById("gallery");
const back = document.getElementById("back");

let currentPath = ROOT;
let history = [];

let currentImages = [];
let currentImageIndex = 0;
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");
const breadcrumb = document.getElementById("breadcrumb");

async function getFolder(path){
    const url = `https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
    const res = await fetch(url);
    return await res.json();
} 

function showFolders(folders){
    folders.forEach(folder => {
        const card = document.createElement("div");
        card.className = "folder";
        card.innerHTML = `
		<img class="folder-icon" src="./png/folder.png" alt="folder">
		<div class="name">${folder.name}</div>
        <button class="copy-folder" title="Copier l'URL du dossier">⧉</button>
	`;

        const button = card.querySelector(".copy-folder");
        button.onclick = (e) => {
            e.stopPropagation();
            const customUrl = `https://creatreasurebox.github.io/rpg-assets/gallery/#${encodeURI(folder.path)}`;
            navigator.clipboard.writeText(customUrl);
            button.textContent = "✓";
            setTimeout(() => {
                button.textContent = "⧉";
            }, 1000);
        };

        card.onclick = () => {
            history.push(currentPath);
            currentPath = folder.path;
            loadFolder(currentPath);
        };

        gallery.appendChild(card); 
    });
}

function showImages(images){
    images.forEach(image => {
        const card = document.createElement("div");
        card.className = "icon";
        card.innerHTML = `
            <img src="${image.download_url}" alt="">
            <button class="download-btn" title="Télécharger l'image">⬇</button>
        `;
        const button = card.querySelector(".download-btn");
        const img = card.querySelector("img");

        img.onclick = () => {
            currentImageIndex = images.indexOf(image);
            openPreview();
        };

        button.onclick = async (e) => {
            e.stopPropagation();
            button.textContent = "⏳";
            
            try {
                const response = await fetch(image.download_url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = image.name;
                document.body.appendChild(a);
                a.click();
                
                window.URL.revokeObjectURL(url);
                button.textContent = "✓";
            } catch (error) {
                console.error("Erreur de téléchargement:", error);
                button.textContent = "❌";
            }
            
            setTimeout(() => {
                button.textContent = "⬇";
            }, 2000);
        };
        gallery.appendChild(card);
    });
}

async function loadFolder(path){
    gallery.innerHTML = "<div style='grid-column: 1 / -1; text-align: center; color: var(--tx1); padding: 40px;'>Chargement en cours...</div>";

    try {
        const files = await getFolder(path);

        gallery.innerHTML = "";

        if (path.endsWith('icons')) {
            gallery.classList.add('icons-folder');
        } else {
            gallery.classList.remove('icons-folder');
        }

        files.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'dir' ? -1 : 1;
            }
            return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
        });

        const folders = files.filter(f => f.type === "dir");
        const images = files.filter(f => f.type === "file" && /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name));
        currentImages = images;

        showFolders(folders);
        showImages(images);

        if(path !== ROOT){
            back.classList.remove("hidden");
        } else {
            back.classList.add("hidden");
        }

        updateBreadcrumb(path);

    } catch (error) {
        gallery.innerHTML = `<div style='grid-column: 1 / -1; color: red; text-align: center;'>Erreur de connexion à GitHub.</div>`;
    }
}

back.onclick = () => {
    if (history.length > 0) {
        currentPath = history.pop();
        loadFolder(currentPath);
    } else {
        currentPath = ROOT;
        loadFolder(ROOT);
    }
};

const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");

function openPreview(){
    if(!preview || !previewImage) return;

    previewImage.src = currentImages[currentImageIndex].download_url;

    const oldBtn = preview.querySelector('.preview-download-btn');
    if (oldBtn) oldBtn.remove();

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'preview-download-btn';
    downloadBtn.title = 'Télécharger cette image en grand';
    downloadBtn.textContent = '⬇';

    downloadBtn.onclick = async (e) => {
        e.stopPropagation();
        downloadBtn.textContent = "⏳";

        try {
            const response = await fetch(currentImages[currentImageIndex].download_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = currentImages[currentImageIndex].name;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            downloadBtn.textContent = "✓";
        } catch (error) {
            console.error("Erreur de téléchargement:", error);
            downloadBtn.textContent = "❌";
        }

        setTimeout(() => {
            downloadBtn.textContent = "⬇";
        }, 2000);
    };

    preview.querySelector('.preview-content').appendChild(downloadBtn);

    preview.classList.remove("hidden", "hide");

    requestAnimationFrame(() => {
        preview.classList.add("show");
    });
}

function hidePreview(){
    if(!preview || !previewImage) return;

    preview.classList.remove("show");
    preview.classList.add("hide");

    setTimeout(() => {
        preview.classList.add("hidden");
        preview.classList.remove("hide");
        previewImage.src = "";
    }, 250);
}

if(preview){
    preview.onclick = (e) => {
        if(e.target === preview){
            hidePreview();
        }
    };
}

prevImage.onclick = (e) => {
    e.stopPropagation();
    showImage(currentImageIndex - 1);
};

nextImage.onclick = (e) => {
    e.stopPropagation();
    showImage(currentImageIndex + 1);
};

function showImage(index){
    if(index < 0){
        index = currentImages.length - 1;
    } else if(index >= currentImages.length){
        index = 0;
    }

    currentImageIndex = index;
    previewImage.src = currentImages[currentImageIndex].download_url;
}

function updateBreadcrumb(path){
    if(!breadcrumb) return;

    const parts = path.split("/");

    if(parts[0] === ROOT){
        parts.shift();
    }

    breadcrumb.textContent = parts.length ? parts.join(" / ") : "accueil";
}

const hashPath = decodeURI(window.location.hash.substring(1));

if (hashPath) {
    currentPath = hashPath;
    loadFolder(hashPath);
} else {
    loadFolder(ROOT);
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});