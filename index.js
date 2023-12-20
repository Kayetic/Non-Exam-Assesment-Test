eventsList = [];

function getFormattedMonth(month) {
  // Add a leading zero to single-digit months
  return month.length === 1 ? `0${month}` : month;
}

async function fetchEvents(year, month) {
  const formattedMonth = getFormattedMonth(month.toString());
  try {
    const response = await fetch(
      `https://p6kbzyq4s7.execute-api.eu-west-2.amazonaws.com/dev/fetchEvents?year=${year}&month=${formattedMonth}`
    );

    const data = await response.json();

    // Check if the response contains a message indicating no events were found
    if (data.message && data.message === "No events found for this month") {
      console.log("No events found for this month");
      createEventDivs(false);
      return;
    }
    eventsList = data.events; // Use the 'data' variable here
    console.log(eventsList);
    createEventDivs(eventsList);
  } catch (error) {
    console.error("Error:", error);
    setTimeout(() => {
      fetchEvents(year, month);
    }, 10000);
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
  for (let i = 0; i < eventsList.length; i++) {
    const eventName = eventsList[i]["name"];
    const eventElement = document.createElement("div");
    eventElement.classList.add("event");
    eventElement.innerHTML = `
            <div class="event__title">${eventName}</div>
            <div class="event__date">${eventsList[i]["date"]}</div>
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
      `https://hppgptf7otm5ngtj45n2g6vv6a0injlh.lambda-url.eu-west-2.on.aws/fetchEvents?year=${year}&month=${month}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      console.log("Event added successfully");
      // Handle successful response here
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

  const startTimeToPost = document.querySelector(".input-start").value;
  const endTimeToPost = document.querySelector(".input-end").value;
  const locationToPost = document.querySelector(".input-location").value;

  const eventToPost = {
    name: nameToPost,
    date: dateToPost,
    start_time: startTimeToPost,
    end_time: endTimeToPost,
    location: locationToPost,
    color: generateRandomColors(),
  };

  newEvents.push(eventToPost);
  console.log(eventToPost);
  setTimeout(() => {
    console.log(extractedMonth, extractedYear);
    postEvent(eventToPost, extractedYear, extractedMonth);
  }, 500);

  console.log(newEvents);
});
