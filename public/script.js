document
  .getElementById("submitButton")
  .addEventListener("click", async function (event) {
    event.preventDefault(); // Prevents form submission
    console.log("Clicked");

    const userInput = document.getElementById("user-input").value;

    if (userInput.trim() === "") {
      alert("Please type a message");
      return;
    }

    const chatbox = document.getElementById("messages");

    // Display user message in chatbox
    chatbox.innerHTML += `<div class="user-message"><strong>You:</strong> ${userInput}</div>`;
    chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to bottom

    // Send message to AI chatbot API
    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.response;

        // Display AI response in chatbox
        chatbox.innerHTML += `<div class="ai-message"><strong>AI:</strong> ${aiResponse}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to bottom
      } else {
        console.error("Error with response", response.statusText);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }

    // Clear input field
    document.getElementById("user-input").value = "";
  });
