let notifications = document.querySelector(".notifications");
let success = document.getElementById("success");
let error = document.getElementById("error");
let warning = document.getElementById("warning");
let info = document.getElementById("info");

function createToast(type, icon, title, text) {
  let newToast = document.createElement("div");
  newToast.innerHTML = `
            <div class="toast-custom ${type}">
                <i class="${icon}"></i>
                <div class="content">
                    <div class="title">${title}</div>
                    <span>${text}</span>
                </div>
                <i class="fa-solid fa-xmark" onclick="(this.parentElement).remove()"></i>
            </div>`;
  notifications.appendChild(newToast);
  newToast.timeOut = setTimeout(() => newToast.remove(), 5000);
}
/* success.onclick = function () {
  let type = "success";
  let icon = "bi bi-exclamation-circle";
  let title = "Success";
  let text = "This is a success toast.";
  createToast(type, icon, title, text);
};
error.onclick = function () {
  let type = "error";
  let icon = "bi bi-exclamation-circle";
  let title = "Error";
  let text = "This is a error toast.";
  createToast(type, icon, title, text);
};
warning.onclick = function () {
  let type = "warning";
  let icon = "bi bi-exclamation-circle";
  let title = "Warning";
  let text = "This is a warning toast.";
  createToast(type, icon, title, text);
};
info.onclick = function () {
  let type = "info";
  let icon = "bi bi-exclamation-circle";
  let title = "Info";
  let text = "This is a info toast.";
  createToast(type, icon, title, text);
};
 */
