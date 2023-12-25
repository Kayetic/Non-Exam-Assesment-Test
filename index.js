eventsList = [];

function getFormattedMonth(month) {
  // Add a leading zero to single-digit months
  return month.length === 1 ? `0${month}` : month;
}

async function fetchEvents(year, month) {
  const formattedMonth = getFormattedMonth(month.toString());
  try {
    // Assuming backend is modified to return a list of all events for the month
    const response = await fetch(
      `https://kaosevxmrvkc2qvjjonfwae4z40bylve.lambda-url.eu-west-2.on.aws/calendarManager?year=${year}&month=${formattedMonth}`
    );

    const data = await response.json();

    // Handle the case where no events are found or handle the list of event file names
    if (!data || data.length === 0) {
      console.log("No events found for this month");
      // Handle no events found
      createEventDivs(false);
    } else {
      // Assuming 'data' is an array of events
      eventsList = data; // Update the UI with these events
      console.log(eventsList.events);
      // Update your UI here with the eventsList
      createEventDivs(eventsList);
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle errors, possibly with retry logic or user notification
  }
}

const eventContainer = document.querySelector(".events-container");

const createEventDivs = function (eventsFound = true) {
  if (!eventsFound) {
    const noEventsFound = document.createElement("div");
    noEventsFound.classList.add("no-events");
    noEventsFound.textContent = "No events found for this month";
    eventContainer.appendChild(noEventsFound);
    return;
  }
  let count = 0;
  for (let i = 0; i < eventsList.events.length; i++) {
    const eventName = eventsList.events[i]["name"];
    const eventElement = document.createElement("div");
    eventElement.classList.add("event");
    eventElement.innerHTML = `
            <div class="individual_event event__title">${eventName}</div>
            <div class="individual_event event__date">${eventsList.events[i]["date"]}</div>
            <div class="individual_event_times">
              <div class="individual_event style_small event__start">${eventsList.events[i]["start_time"]}</div>
              <div class="individual_event style_small event__end">${eventsList.events[i]["end_time"]}</div>
            </div>
            <div class="individual_event event__location">${eventsList.events[i]["location"]}</div>
            <div class="individual_event event__id">${eventsList.events[i]["eventID"]}</div>
            <div class="individual_event event__user">User: ${eventsList.events[i]["user"]}</div>

        `;
    eventContainer.appendChild(eventElement);
    console.log(eventName);
    count++;
  }
};

// get current date
const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();

fetchEvents(year, month);

const dateElement = document.querySelector(".date");
dateElement.textContent = `${day}/${month}/${year}`;

nextMonthArrow = document.querySelector(".next-month");
previousMonthArrow = document.querySelector(".previous-month");
let selectedDay = day;
let selectedMonth = month;
let selectedYear = year;

nextMonthArrow.addEventListener("click", function () {
  selectedMonth++;
  if (selectedMonth > 12) {
    selectedMonth = 1;
    selectedYear++;
  }
  updateDatePicker(selectedYear, selectedMonth);
  fetchEvents(selectedYear, selectedMonth);
  clearEventsScreen();
  console.log(selectedMonth);
});

previousMonthArrow.addEventListener("click", function () {
  selectedMonth--;
  if (selectedMonth < 1) {
    selectedMonth = 12;
    selectedYear--;
  }
  updateDatePicker(selectedYear, selectedMonth);
  fetchEvents(selectedYear, selectedMonth);
  clearEventsScreen();
  console.log(selectedMonth);
});

const updateDatePicker = function (year, month) {
  const dateElement = document.querySelector(".date");
  dateElement.textContent = `${day}/${month}/${year}`;
};

const clearEventsScreen = function () {
  const events = document.querySelectorAll(".event");
  events.forEach((event) => {
    eventContainer.removeChild(event);
  });

  const noEventsElement = document.querySelector(".no-events");
  if (noEventsElement) {
    eventContainer.removeChild(noEventsElement);
  }
};

async function postEvent(eventData, year, month) {
  try {
    const response = await fetch(
      `https://kaosevxmrvkc2qvjjonfwae4z40bylve.lambda-url.eu-west-2.on.aws/calendarManager?year=${year}&month=${month}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      console.log("Event added successfully", responseData);
      // Use responseData here to get details like the new event ID or confirmation message
    }
  } catch (error) {
    console.error("Error posting event:", error);
  }
}

const generateRandomColors = function () {
  const backgroundColor =
    "#" + Math.floor(Math.random() * 16777215).toString(16);
  const textColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
  return { background: backgroundColor, text: textColor };
};

// Global array to store events
const newEvents = [];

const addEventButton = document.querySelector(".add-event-btn");
addEventButton.addEventListener("click", function () {
  const nameToPost = document.querySelector(".input-title").value;
  const dateToPost = document.querySelector(".input-date").value;
  const extractedMonth = dateToPost.slice(5, 7);
  const extractedYear = dateToPost.slice(0, 4);
  let userToPost = document.querySelector(".input-user").value;

  if (userToPost === "") {
    userToPost = "Bartek";
  }

  const startTimeToPost = document.querySelector(".input-start").value;
  const endTimeToPost = document.querySelector(".input-end").value;
  const locationToPost = document.querySelector(".input-location").value;

  const eventToPost = {
    name: nameToPost,
    date: dateToPost,
    start_time: startTimeToPost,
    end_time: endTimeToPost,
    location: locationToPost,
    user: userToPost,
    color: generateRandomColors(),
  };

  newEvents.push(eventToPost);
  console.log(eventToPost);

  console.log(extractedMonth, extractedYear);
  postEvent(eventToPost, extractedYear, extractedMonth);

  console.log(newEvents);
  fetchEvents(extractedYear, extractedMonth);
});
