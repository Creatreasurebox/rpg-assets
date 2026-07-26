const USER="Creatreasurebox";
const REPO="rpg-assets";
const ROOT="assets";
 
const gallery=document.getElementById("gallery");
const back=document.getElementById("back");

let currentPath=ROOT;
let history = [];

let currentImages = [];
let currentImageIndex = 0;
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");
const breadcrumb = document.getElementById("breadcrumb");

// récupérer le contenu d'un dossier github
async function getFolder(path){
    const url=`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`;
    const res=await fetch(url);
    return await res.json();
} 

function showFolders(folders){
    folders.forEach(folder=>{
        const card=document.createElement("div");
        card.className="folder";
        // Ajout du bouton copy-folder dans l'interface[cite: 1]
        card.innerHTML=`
		<img class="folder-icon" src="./png/folder.png" alt="folder">
		<div class="name">${folder.name}</div>
        <button class="copy-folder" title="Copier l'URL du dossier">⧉</button>
	`;

        // Gestion du clic sur le bouton de copie
        const button = card.querySelector(".copy-folder");
        button.onclick = (e) => {
            e.stopPropagation(); // Empêche d'ouvrir le dossier quand on clique sur copier[cite: 1]
            navigator.clipboard.writeText(folder.html_url); // Copie le lien GitHub du dossier
            button.textContent = "✓";
            setTimeout(()=>{
                button.textContent = "⧉";
            }, 1000);
        };

        // Comportement normal au clic sur le reste de la carte[cite: 1]
        card.onclick=()=>{
            history.push(currentPath);
            currentPath=folder.path;
            loadFolder(currentPath);
        };

        gallery.appendChild(card); //[cite: 1]
    });
}

function showImages(images){

    images.forEach(image=>{
        const card=document.createElement("div");
        card.className="icon";
        card.innerHTML=`
            <img src="${image.download_url}" alt="">
            <button class="copy" title="Copier l'URL">⧉</button>
        `;
        const button=card.querySelector(".copy");

        const img = card.querySelector("img");

        img.onclick = ()=>{
            currentImageIndex = images.indexOf(image);
            openPreview();
        };

        button.onclick=(e)=>{
            e.stopPropagation();
            navigator.clipboard.writeText(image.download_url);
            button.textContent="✓";
            setTimeout(()=>{
                button.textContent="⧉";
            },1000);
        };
        gallery.appendChild(card);
    });
}

// charge un dossier
async function loadFolder(path){
    gallery.innerHTML = "";

    const files = await getFolder(path);

    const folders = files.filter(
        f => f.type === "dir"
    );

    const images = files.filter(
        f =>
        f.type === "file" &&
        /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name)
    );
    currentImages = images;

    showFolders(folders);
    showImages(images);

    // affiche le bouton retour si pas à la racine
    if(path !== ROOT){
        back.classList.remove("hidden");
    }else{
        back.classList.add("hidden");
    }

    // fil d'ariane
    updateBreadcrumb(path);
}

// back to homepage
back.onclick = ()=>{
    if (history.length > 0) {
        currentPath = history.pop();
        loadFolder(currentPath);
    } else {
        currentPath = ROOT;
        loadFolder(ROOT);
    }
};

// ajoute le preview

const preview = document.getElementById("preview");
const previewImage = document.getElementById("previewImage");

function openPreview(){
    if(!preview || !previewImage) return;

    previewImage.src = currentImages[currentImageIndex].download_url;

    preview.classList.remove("hidden", "hide");

    requestAnimationFrame(() => {
        preview.classList.add("show");
    });
}

function hidePreview(){
    if(!preview || !previewImage) return;

    preview.classList.remove("show");
    preview.classList.add("hide");

    // pour l'animation
    setTimeout(() => {
        preview.classList.add("hidden");
        preview.classList.remove("hide");
        previewImage.src = "";
    }, 250);
}

// ferme quand je clique en-dehors de l'image
if(preview){
    preview.onclick = (e) => {
        if(e.target === preview){
            hidePreview();
        }
    };
}

// comportement du clic sur les flèches de preview
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
    }else if(index >= currentImages.length){
        index = 0;
    }

    currentImageIndex = index;
    previewImage.src = currentImages[currentImageIndex].download_url;
}

// ajout fil d'ariane
function updateBreadcrumb(path){
    if(!breadcrumb) return;

    const parts = path.split("/");

    if(parts[0] === ROOT){
        parts.shift();
    }

    breadcrumb.textContent = parts.length ? parts.join(" / ") : "accueil";
}


// lance la galerie
loadFolder(ROOT);
