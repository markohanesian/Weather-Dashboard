$( document ).ready(function() {
  
    
    let api =  "eb9d945f7a1f053eb3554527c8bf3bec"


    $("#searchbutton").on("click", function(){
       let city =  $("#searchinput").val();

       $.ajax({url: `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${api}`, success: function(result){
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
});