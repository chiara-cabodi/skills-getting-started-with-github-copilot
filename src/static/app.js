document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loader = document.getElementById('loader');

  function showLoader() {
    if (loader) loader.classList.remove('hidden');
  }

  function hideLoader() {
    if (loader) loader.classList.add('hidden');
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      showLoader();
      const response = await fetch(`/activities?t=${Date.now()}`, { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants section programmatically so we can attach listeners
        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';
        const title = document.createElement('h5');
        title.textContent = 'Participants';
        participantsDiv.appendChild(title);

        if (details.participants && details.participants.length) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach(p => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = p;

            const del = document.createElement('button');
            del.className = 'participant-delete';
            del.title = 'Unregister';
            del.textContent = '✕';
            del.addEventListener('click', async () => {
              const conferma = confirm(`Sei sicuro di voler rimuovere ${p} da ${name}?`);
              if (!conferma) return;
              await deleteParticipant(name, p);
            });

            li.appendChild(span);
            li.appendChild(del);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const pNo = document.createElement('p');
          pNo.className = 'no-participants';
          pNo.textContent = 'No participants yet';
          participantsDiv.appendChild(pNo);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    } finally {
      hideLoader();
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      showLoader();
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      hideLoader();
    }
  });

  // Initialize app
  fetchActivities();

  // Delete participant from activity
  async function deleteParticipant(activityName, email) {
    try {
      showLoader();
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        cache: 'no-store'
      });

      const result = await resp.json();
      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
      }
    } catch (err) {
      console.error('Error unregistering participant:', err);
    } finally {
      hideLoader();
    }
  }
});
