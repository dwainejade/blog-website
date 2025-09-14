const storeInSession = (key, value) => {
  sessionStorage.setItem(key, value);
};

const lookupInSession = (key) => {
  return sessionStorage.getItem(key);
};

const removeFromSession = (key) => {
  sessionStorage.removeItem(key);
};

const logoutUser = () => {
  sessionStorage.clear();
  window.location.href = "/signin"; // redirect to signin page
};

export { storeInSession, lookupInSession, removeFromSession, logoutUser };

// usage example
storeInSession("user", JSON.stringify(user));
const user = JSON.parse(lookupInSession("user"));
removeFromSession("user");
// removeFromSession("user");

// sessionStorage.clear(); // clears all session storage
