var token = window.location.search.split("?token=")[1];
$.ajax ({
        type: "GET",
        url: 'http://localhost:8080/api/doaction/' + token,
        success: function (data) {
            console.log(data);
            var dataObj = JSON.parse(data);
            alert(dataObj.Message);
        },
        fail: function (data) {
            console.log(data);
            alert("server returned a failure response");
        },
        error: function (data) {
            console.log(data);
            alert("error connecting to server");
        }
    });
 window.location = 'http://localhost:8888';