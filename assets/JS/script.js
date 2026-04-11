$( document ).ready(function() {
  
    
    let api =  "REMOVED_FOR_SECURITY"


    $("#newsearch").on("click", function(){
       let city =  $("#cityname").val();

       $.ajax({url: `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${api}`, success: function(result){
        console.log(result)
        
        let name = result.name;
        console.log(`This is the city name: ${name}`)
        $("#name").text(name)

        let lon = result.coord.lon;
        console.log(`This is the long: ${lon}`)
        $("#lon").text(lon)

        let temp = result.main.temp + "°F";
        console.log(`this is the temperature: ${temp}`)
        $("#temp").text(temp)

        let humidity = result.main.humidity;
        console.log(`this is the humidity: ${humidity}`)
        $("#humidity").text(humidity)

        let speed = result.wind.speed;
        console.log(`this is the wind speed: ${speed}`)
        $("#windspeed").text(speed)


      }})
    })

    const searchHistory = []
    
    if(JSON.parse(localStorage.getItem(`weather-app-search-history`)) !== null){
      searchHistory = JSON.parse(localStorage.getItem(`weather-app-search-history`))
  }
});


