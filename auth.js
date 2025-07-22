const form = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  fetch("users.json")
    .then((res) => res.json())
    .then((users) => {
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      if (user) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "home.html";
      } else {
        errorMsg.textContent = "Login yoki parolni notogri kiritdingiz";
      }
    })
    .catch((err) => {
      errorMsg.textContent = "Xatolik boldi";
      console.error(err);
    });
});
