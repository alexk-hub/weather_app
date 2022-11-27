document.addEventListener("DOMContentLoaded", function() {

    class View {
        constructor() {
            this.form = document.querySelector(".form-section form");
            this.input = document.querySelector(".form-section input");
            this.msg = document.querySelector(".form-section .msg");
            this.list = document.querySelector(".list-section .cities");
            this.displayCity = document.getElementById("city");
            this.displayCountry = document.getElementById("country");
            this.displayTemperature = document.getElementById("temperature");
            this.displayConditions = document.getElementById("conditions");
        }
        showLocalWeather(obj) {
            this.displayCity.innerHTML = obj.name;
            this.displayCountry.innerHTML = obj.sys.country;
            this.displayTemperature.innerHTML = `${Math.round(obj.main.temp)}<sup>°C</sup>`;
            this.displayConditions.innerHTML = obj.weather[0].description;
            let newElement = document.createElement('img');
            newElement.src = 'https://api.openweathermap.org/img/w/' + obj.weather[0].icon + '.png';
            newElement.setAttribute("id", "icons");
            document.getElementById("icon").appendChild(newElement);
            document.getElementById("localWeather-wrapper").style.display = "block";
            document.querySelector(".form-section").style.display = "block";
        }
        showWeatherInSelCities(obj) {
            const icon = 'https://api.openweathermap.org/img/w/' + obj.weather[0].icon + '.png';
            const li = document.createElement("li");
            li.classList.add("city");
            const markup = `
			<button class="delete">X</button>
			<button class="edit button">EDIT</button>
			<h2 class="divField">${obj.name}</h2>
			<h2 class="city-name" data-name="${obj.name},${obj.sys.country}">
			<span>${obj.name}</span>
			<sup>${obj.sys.country}</sup>
			</h2>
			<div class="city-temp">${Math.round(obj.main.temp)}<sup>°C</sup></div>
			<figure>
			<img class="city-icon" src="${icon}" alt="${obj.weather[0]["description"]}">
			<figcaption>${obj.weather[0]["description"]}</figcaption>
			</figure>`;
            li.innerHTML = markup;
            this.list.appendChild(li);
        }
        changeSelectedCity(obj, cityElemHtml) {
            const icon = 'https://api.openweathermap.org/img/w/' + obj.weather[0].icon + '.png';
            cityElemHtml.querySelector(".city-name").dataset.name = `${obj.name},${obj.sys.country}`;
            cityElemHtml.querySelector(".city-name span").innerText = obj.name;
            cityElemHtml.querySelector(".city-name sup").innerText = obj.sys.country;
            cityElemHtml.querySelector(".city-temp").innerHTML = `${Math.round(obj.main.temp)}<sup>°C</sup>`;
            cityElemHtml.querySelector("figure").innerHTML =
                `<img class="city-icon" src="${icon}" alt="${obj.weather[0]["description"]}">
			<figcaption>${obj.weather[0]["description"]}</figcaption>`;
        }
    }

    class Model {
        constructor(view) {
            this.view = view;
            this.apiKey = "YOUR KEY";
            this.tasks = JSON.parse(localStorage.getItem("weatherList"));
            this.getLocalWeather = this.getLocalWeather.bind(this);
            this.getAllObservedCities = this.getAllObservedCities.bind(this);
            this.getWeatherDataForLocStorCities = this.getWeatherDataForLocStorCities.bind(this);
            this.getWeatherDataForNewAddCity = this.getWeatherDataForNewAddCity.bind(this);
            this.getWeatherDataForChangedCity = this.getWeatherDataForChangedCity.bind(this);
        }
        locationByIP = () => {
            var locationRequest = new XMLHttpRequest();
            locationRequest.onreadystatechange = () => {
                if (locationRequest.readyState === 4 && locationRequest.status === 200) {
                    var locationObj = JSON.parse(locationRequest.responseText);
                    var locCity = locationObj.city;
                    let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + locCity + '&APPID=' + this.apiKey + '&units=metric';
                    this.getLocalWeather(url);
                }
            };
            locationRequest.open("GET", 'https://ipapi.co/json/', true);
            locationRequest.send();
        }
        getLocalWeather(url) {
            const weatherRequest = new XMLHttpRequest();
            weatherRequest.onreadystatechange = () => {
                if (weatherRequest.readyState === 4 && weatherRequest.status === 200) {
                    var obj = JSON.parse(weatherRequest.responseText);
                    this.view.showLocalWeather(obj);
                    this.getAllObservedCities();
                }
            };
            weatherRequest.open("GET", url, true);
            weatherRequest.send();
        }
        async getAllObservedCities() {
            for (var i = 0; i < this.tasks.length; i++) {
                let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + this.tasks[i].name + '&APPID=' + this.apiKey + '&units=metric';
                await this.getWeatherDataForLocStorCities(url, i);
            }
            document.querySelector(".list-section").style.display = "block";
        }
        async getWeatherDataForLocStorCities(url, locStorListIndex) {
            let weatherRequest = await fetch(url);
            let obj = await weatherRequest.json();
            this.tasks.splice(locStorListIndex, 1, obj);
            this.view.showWeatherInSelCities(this.tasks[locStorListIndex]);
        }
        addCityToObserve = () => {
            const listItems = this.view.list.querySelectorAll(".list-section .city");
            const listItemsArray = Array.from(listItems);

            if (listItemsArray.length > 0) {
                const filteredArray = listItemsArray.filter(el => {
                    let content = "";

                    if (this.view.input.value.includes(",")) {
                        if (this.view.input.value.split(",")[1].length > 2) {
                            this.view.input.value = this.view.input.value.split(",")[0];
                            content = el.querySelector(".city-name span").textContent.toLowerCase();
                        } else {
                            content = el.querySelector(".city-name").dataset.name.toLowerCase();
                        }
                    } else {
                        content = el.querySelector(".city-name span").textContent.toLowerCase();
                    }

                    return content == this.view.input.value.toLowerCase();
                });

                if (filteredArray.length > 0) {
                    this.view.msg.innerText = `You already know the weather for ${filteredArray[0].querySelector(".city-name span").textContent}.
					But you can still check the weather somewhere else:)`;
                    this.view.form.reset();
                    this.view.input.focus();
                    return;
                }
            }
            let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + this.view.input.value + '&APPID=' + this.apiKey + '&units=metric';
            this.getWeatherDataForNewAddCity(url, this.view.input.value);
            this.view.msg.textContent = "";
            this.view.form.reset();
            this.view.input.focus();
        }
        async getWeatherDataForNewAddCity(url, inputValue) {
            let weatherRequest = await fetch(url);

            if (weatherRequest.ok && weatherRequest.status === 200) {
                let obj = await weatherRequest.json();
                this.view.showWeatherInSelCities(obj);
                this.tasks.push(obj);
                localStorage.setItem('weatherList', JSON.stringify(this.tasks));
            } else if (weatherRequest.status >= 400) {
                this.view.msg.innerText = `City "${inputValue}" not found.`;
            }
        }
        editSelectedCity = (locStorListIndex, changedCity, cityElemHtml) => {
            let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + changedCity + '&APPID=' + this.apiKey + '&units=metric';
            this.getWeatherDataForChangedCity(url, cityElemHtml, locStorListIndex);
        }
        async getWeatherDataForChangedCity(url, cityElemHtml, locStorListIndex) {
            let weatherRequest = await fetch(url);
            let corrCityName = cityElemHtml.childNodes[7];
            let errCityName = cityElemHtml.childNodes[5];
            if (weatherRequest.ok && weatherRequest.status === 200) {
                corrCityName.setAttribute("data-content", "");
                let obj = await weatherRequest.json();
                this.view.changeSelectedCity(obj, cityElemHtml);
                this.tasks.splice(locStorListIndex, 1, obj);
                localStorage.setItem('weatherList', JSON.stringify(this.tasks));
            } else if (weatherRequest.status >= 400) {
                corrCityName.setAttribute("data-content", `City "${errCityName.innerText}" does not exist.`);
            }
        }
        removeSelectedCity = (locStorListIndex) => {
            this.tasks.splice(locStorListIndex, 1);
            localStorage.setItem('weatherList', JSON.stringify(this.tasks));
        }
    }

    class Controller {
        constructor(model, view) {
            this.model = model;
            this.view = view;
        }
        addCityToObserve = (event) => {
            event.preventDefault();
            if (this.view.input.value !== "") {
                this.model.addCityToObserve();
            } else {
                this.view.msg.innerText = `Please enter a city name!`;
            }
        }
        editSelectedCity = (event) => {
            if (event.target.className == 'edit button') {
                let divEdit = event.target.nextElementSibling;

                if (divEdit.contentEditable == "true") {
                    divEdit.contentEditable = "false";
                    event.target.innerHTML = "EDIT";
                    this.item = event.target.closest('li');
                    this.item.querySelector(".divField").style.display = "none";
                    this.item.querySelector(".city-name").style.display = "block";

                    let index = Array.from(this.item.parentNode.children).indexOf(this.item);
                    this.model.editSelectedCity(index, divEdit.innerText, this.item);
                } else {
                    this.item = event.target.closest('li');
                    this.item.querySelector(".city-name").style.display = "none";
                    this.item.querySelector(".divField").style.display = "block";
                    divEdit.contentEditable = "true";
                    divEdit.focus();
                    event.target.innerHTML = "READY";
                }
            }
        }
        removeSelectedCity = (event) => {
            if (event.target.className == 'delete') {
                this.item = event.target.closest('li');
                let index = Array.from(this.item.parentNode.children).indexOf(this.item);
                this.model.removeSelectedCity(index);
                this.item.remove();
            }
        }
        handle() {
            this.view.form.addEventListener("submit", this.addCityToObserve);
            this.view.list.addEventListener('click', this.editSelectedCity);
            this.view.list.addEventListener('click', this.removeSelectedCity);
            this.model.locationByIP();
        }
    }

    (function init() {
        if (localStorage.weatherList === undefined) {
            localStorage.setItem('weatherList', JSON.stringify([]));
        }
        const view = new View();
        const model = new Model(view);
        const controller = new Controller(model, view);
        controller.handle();
    })();
});