$( document ).ready(function() {
  
    
    let api =  "eb9d945f7a1f053eb3554527c8bf3bec"


    $("#searchbutton").on("click", function(){
       let city =  $("#searchinput").val();

       $.ajax({url: `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api}`, success: function(result){
        console.log(result)
        let lon = result.coord.lon;
        console.log(`This is the long: ${lon}`)
        let temp = result.main.temp;
        console.log(`this is the temp: ${temp}`)
        $("#temp").text(temp)
       
      }})
    })
   





});