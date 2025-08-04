
// Ensure everything waits for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const symptomsContainer = document.getElementById("symptoms");
  const questionsContainer = document.getElementById("questions");
  const testsContainer = document.getElementById("chemicalTests");

  fetch('./app_data.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load app_data.json');
      return response.json();
    })
    .then(data => {
      // Render Symptoms
      if (symptomsContainer) {
        for (const [name, detail] of Object.entries(data.symptoms)) {
          const card = document.createElement("div");
          card.className = "p-4 border rounded mb-4 bg-white";
          card.innerHTML = \`
            <h2 class="text-lg font-bold text-blue-700 mb-2">\${name}</h2>
            <p><strong>Causes:</strong> \${detail.causes}</p>
            <p><strong>Actions:</strong> \${detail.actions}</p>
          \`;
          symptomsContainer.appendChild(card);
        }
      }

      // Render Questions
      if (questionsContainer) {
        for (const question of data.questions) {
          const div = document.createElement("div");
          div.className = "mb-2";
          div.innerHTML = \`
            <label class="block text-gray-700 font-medium">\${question.text}</label>
            <input type="checkbox" class="mt-1">
            \${question.note ? '<p class="text-sm text-gray-500">' + question.note + '</p>' : ''}
          \`;
          questionsContainer.appendChild(div);
        }
      }

      // Render Chemical Tests
      if (testsContainer) {
        for (const test of data.chemicalTests) {
          const div = document.createElement("div");
          div.className = "p-4 border border-green-300 bg-green-50 rounded mb-3";
          div.innerHTML = \`
            <h3 class="font-semibold text-green-700">\${test.title}</h3>
            <p>\${test.description}</p>
            \${test.check ? '<p class="mt-2 text-sm text-green-600"><strong>Check:</strong> ' + test.check + '</p>' : ''}
          \`;
          testsContainer.appendChild(div);
        }
      }
    })
    .catch(err => {
      console.error("Error loading app_data.json:", err);
      if (symptomsContainer) {
        symptomsContainer.innerHTML = "<p class='text-red-600'>Failed to load data. Please try refreshing or check your GitHub Pages setup.</p>";
      }
    });
});
