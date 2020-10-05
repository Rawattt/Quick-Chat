const socket = io();

// DOM
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector(".send");
const $messageFormShareLocationButton = document.querySelector(".location");
const $message = document.querySelector("#message");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebar = document.querySelector("#sidebar-template").innerHTML;

// Templates
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoScroll = () => {
  // New message element
  const $newMessage = $message.lastElementChild;

  // Height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $message.offsetHeight;

  // Height of messages container
  const containerHeight = $message.scrollHeight;

  // How far have I scrolled
  const scrollOffset = $message.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $message.scrollTop = $message.scrollHeight;
  }
};

// Message Listener
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $message.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

// Location Message Listener
socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $message.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebar, {
    room,
    users
  });
  document.querySelector(".chat__sidebar").innerHTML = html;
});

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();

  //   disable send button
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target["message"].value;
  socket.emit("sendMessage", message, (message) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});

$messageFormShareLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("This feature is not supported by your browser");

  $messageFormShareLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((data) => {
    const { longitude: long, latitude: lat } = data.coords;

    socket.emit("shareLocation", { long, lat }, () => {
      $messageFormShareLocationButton.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
