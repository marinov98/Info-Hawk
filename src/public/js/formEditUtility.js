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
const SPLITTER_MC = "|";
const JOINER_MC = "|*|";

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
    optionsNew.style.display = "block";
  } else {
    optionsNew.style.display = "none";
  }
}

function createInsertionDivMC(key, userInput) {
  const targetDiv = document.createElement("div");
  targetDiv.id = key;
  targetDiv.className = "new-time mb-3 ";

  const labelToInsert = document.createElement("label");
  labelToInsert.className = "new-item form-label";
  labelToInsert.innerHTML = `${userInput}`;
  targetDiv.appendChild(labelToInsert);
  return targetDiv;
}

function createSelector(key, options, isMultiSelect = false) {
  const selectorToInsert = document.createElement("select");
  selectorToInsert.id = `${key}-selector`;
  selectorToInsert.className = "form-select animate__animated animate__backInLeft";
  if (isMultiSelect) selectorToInsert.multiple = true;
  let success = false;
  const formattedOptions = [];
  options.forEach(userInput => {
    const optionValue = userInput.trim();
    if (optionValue && optionValue !== "") {
      const currOption = document.createElement("option");
      currOption.value = optionValue;
      currOption.innerHTML = optionValue;
      currOption.disabled = true;
      formattedOptions.push(optionValue);
      if (!success) success = true;
      selectorToInsert.appendChild(currOption);
    }
  });
  return success ? { selectorToInsert, formattedOptions } : null;
}

function handleInsertionMC(key, userInput, options, isMultiSelect = false) {
  const targetDiv = createInsertionDivMC(key, userInput);
  const optionsToAppend = options.split(SPLITTER_MC);
  const res = createSelector(key, optionsToAppend, isMultiSelect);
  if (!res) {
    infoError.className = errorClass;
    infoError.textContent = "input did not find valid values!";
  } else {
    const { selectorToInsert, formattedOptions } = res;
    const targetParent = document.getElementById("add_after_me");

    targetDiv.appendChild(selectorToInsert);
    targetParent.insertAdjacentHTML("beforebegin", targetDiv.outerHTML);

    dataStore[key] = formattedOptions.join(JOINER_MC);
    inputNew.value = "";
    optionsNew.value = "";
  }
}

// EVENT LISTENERS
function appendRow(e) {
  e.preventDefault();
  const userInput = form.newItem.value.trim();
  const key = handleKeyErrors(userInput);
  if (key !== null) {
    if (dataStore[key]) {
      infoError.className = errorClass;
      infoError.textContent = "Cannot have duplicate keys!";
    } else {
      infoError.className = infoClass;
      infoError.textContent = originalContent;
      const currSelectedValue = document.getElementById("mc-single-select").value;

      if (currSelectedValue === "single") {
        handleInsertionNonMC(key, userInput);
      } else {
        const userOptionsInput = form.newItemOptions.value.trim();
        if (currSelectedValue === "mc-single") {
          handleInsertionMC(key, userInput, userOptionsInput);
        }

        if (currSelectedValue === "mc-multi") {
          handleInsertionMC(key, userInput, userOptionsInput, true);
        }
      }
    }
  }
}

function removeRow(e) {
  e.preventDefault();
  const userInput = form.newItem.value.trim();
  const key = handleKeyErrors(userInput);
  if (key !== null) {
    handleDeletion(key);
  }
}
