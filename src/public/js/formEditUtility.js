const RESTRICTED = [
  "AdminCode",
  "title",
  "Admincode",
  "Title",
  "admincode",
  "adminCode",
  "Admincode",
  "admin-code",
  "Admin-Code",
  "admin-Code",
  "Admin-code",
  "Admin Code",
  "Form Title"
];

const JOINER = "_^_";

function handleKeyErrors(key) {
  if (!key || key === "") {
    infoError.className = errorClass;
    infoError.textContent = "Key cannoe be empty!";
    key = null;
  } else if (RESTRICTED.includes(key)) {
    infoError.className = errorClass;
    infoError.textContent = "Cannot add/remove restricted keys!";
    key = null;
  }

  return key ? key.split(" ").join(JOINER) : key;
}

function handleInsertionNonMC(key, userInput) {
  infoError.className = infoClass;
  infoError.textContent = originalContent;
  document
    .getElementById("add_after_me")
    .insertAdjacentHTML(
      "beforebegin",
      `<div id=${key} class="new-time mb-3"><label for=${key} class="new-item form-label">${userInput}</label><input type="text" name=${key} class="new-time form-control animate__animated animate__backInLeft" placeholder="Client answer goes here..." readonly/></div>`
    );
  dataStore[key] = true;
  inputNew.value = "";
}

function handleDeletion(key) {
  const divToDelete = document.getElementById(key);
  if (divToDelete) {
    divToDelete.parentNode.removeChild(divToDelete);
    delete dataStore[key];
    infoError.className = infoClass;
    infoError.textContent = originalContent;
    inputNew.value = "";
  } else {
    infoError.className = errorClass;
    infoError.textContent = "Key not found in the form!";
  }
}

// Multi
function showOptionsText() {
  const currSelectedValue = document.getElementById("mc-single-select").value;
  if (currSelectedValue !== "single") {
    optionsText.style.display = "block";
  } else {
    optionsText.style.display = "none";
  }
}
