var homecontroller = angular.module("homecontroller", []);
homecontroller.controller("homecontroller", ["$scope", function ($scope) {

    $scope.buttons = [];
    $scope.loggedIn = false;

    $scope.currentUser;

    $scope.oldPass = "";
    $scope.newPass1 = "";
    $scope.newPass2 = "";

    $scope.suEmail = "";
    $scope.suFirstName = "";
    $scope.suLastName = "";
    $scope.suPass1 = "";
    $scope.suPass2 = "";

    $scope.message = "";

    $scope.changePass = false;

    $scope.currAsset = "";
    $scope.currChartType = "";

    $scope.nameMap = {
        "BTC" : "BTC",
        "EUR/USD" : "EURUSD"
    };

    $scope.chartTypeMap = {
        "24 hour" : "config1",
        "5 day" : "config6",
        "3 day" : "config2"
    }

    $scope.configMap = {
        "config1" : 900,
        "config6" : 3600
    }

    $scope.assets = {
        "BTC" : {
            apiName : "BTC",
            timeOptions : [
                {
                    name : "24 hour",
                    value : "config1"
                },
                {
                    name : "5 day",
                    value : "config6"
                }
            ]
        },
        "EUR/USD" : {
            apiName : "EURUSD",
            timeOptions : [
                {
                    name : "24 hour",
                    value : "config1"
                },
                {
                    name : "3 day",
                    value : "config2"
                }
            ]
        }
    };

    $scope.chart = {
        asset : "BTC",
        startTS : Math.round(Date.now() / 1000),
        type: "24 hour"
    };

    $scope.init = function() {
        $scope.addButton("Home", "/");
        $scope.addButton("Charts", "/charts");
        $scope.addButton("About", "/about");
        $scope.addButton("Contact", "/contact");

        // check if user is logged in
        $.ajax({
            type: "GET",
            url: "http://localhost:8080/api/sessions",
            headers: {
                "AuthToken" : document.cookie.split("=")[1]
            },
            success: function(data) {
                console.log(data);
                var body = JSON.parse(data);
                if (body.Error === false) {
                    $scope.currentUser = body.Message;
                    $scope.loggedIn = true;
                    $scope.apply();
                }
            }
        });

        $scope.refreshChart();
        $scope.apply();
    }

    $scope.addButton = function(name, url) {
        var tempButton = {
            "name" : name,
            "url" : url
        }
        $scope.buttons.push(tempButton);
    }

    $scope.navigateTo = function(url) {
        location.href=url;
    }

    $scope.signup = function(email, firstName, lastName, pass1, pass2) {
        if (pass1 !== pass2) {
            alert("Passwords must match");
            return;
        }
        var payload = {
            "Email" : email,
            "FirstName" : firstName,
            "LastName" : lastName,
            "Salt" : pass1
        }
        $.ajax({
            type: "POST",
            url: "http://localhost:8080/api/signup",
            data: JSON.stringify(payload),
            success: function(data) {
                var result = JSON.parse(data);
                if (result.Error === true) {
                    alert("Failed to create user - account with this email already exists");
                } else {
                    var payload2 = {
                        "Action" : "verifyEmail",
                        "Email" : $scope.suEmail
                    }
                    $.ajax({
                        type: "POST",
                        url: "http://localhost:8080/api/doaction",
                        data: JSON.stringify(payload2),
                        success: function(data) {
                            var result2 = JSON.parse(data);
                            if (result2.Error === false) {
                                alert("Thank you for signing up! You must verify your account before you can log in. Please check your email for a verification link.");
                                window.location = "http://localhost:8888";
                                return;
                            } else {
                                alert("Failed to send verification email.");
                                return;
                            }
                        }
                    })
                }
            }
        })
    }

    $scope.forgotPassword = function() {
        var email = prompt("Enter email address", "");
        if (email !== null) {
            var payload = {
                "Action" : "resetPassword",
                "Email" : email
            }
            $.ajax({
                type: "POST",
                url: "http://localhost:8080/api/doaction",
                data: JSON.stringify(payload),
                success: function(data) {
                    var body = JSON.parse(data);
                    if (body.Error === false) {
                        alert("An email has been sent to the provided address with instructions for reseting the password");
                    } else {
                        alert("Failed to reset password for the provided email. If you believe this is a mistake, please contact us at btcpredictions@gmail.com");
                    }
                }
            })
        }
    }

    $scope.changePassword = function(old, new1, new2, email) {
        if (new1 !== new2) {
            alert("New passwords entered do not match");
            return;
        } else {
            var payload = {
                "Email" : email,
                "OldPass" : old,
                "NewPass" : new1
            }
            $.ajax({
                type: "POST",
                url: "http://localhost:8080/api/users/changepassword",
                data: JSON.stringify(payload),
                success: function(data) {
                    var body = JSON.parse(data);
                    alert(body.Message);
                    $scope.changePass = false;
                    $scope.apply();
                }
            })
        }
        $scope.changePass = false;
        $scope.oldPass = "";
        $scope.newPass1 = "";
        $scope.newPass2 = "";
        $scope.apply();
    }

    $scope.logout = function() {
        payload = document.cookie.split("=")[1]
        $.ajax({
            type: "POST",
            url: "http://localhost:8080/api/users/logout",
            data: payload,
            success: function(data) {
                var body = JSON.parse(data);
                alert(body.Message);
                location.reload();
            }
        })
    }

    $scope.login = function(email, password) {
        payload = {
            "Email" : email,
            "Password" : password
        }
        $.ajax({
            type: "POST",
            url: "http://localhost:8080/api/users/login",
            data: JSON.stringify(payload),
            success: function(data) {
                var body = JSON.parse(data);
                if (body.Error === false) {
                    document.cookie = "AuthToken=" + body.Message;
                    $scope.loggedIn = true;
                    $scope.currentUser = email;
                    $scope.apply();
                } else {
                    alert(body.Message);
                }
            }
        })
    }

    $scope.refreshChart = function() {
        var curTS = $scope.chart.startTS;
        var prevTS = curTS - 500;
        var interval = $scope.configMap[$scope.chartTypeMap[$scope.chart.type]];
        $.ajax ({
            type: "GET",
            url: 'http://209.6.95.98:82/api/data/predictions?start=' +
                prevTS + '&end=' + curTS + '&stockId=' + $scope.nameMap[$scope.chart.asset] +
                '&predType=' + $scope.chartTypeMap[$scope.chart.type],
//            headers: {
//                "AuthToken" : document.cookie.split("=")[1]
//            },
            success: function (data) {
                // Create the chart
                data = JSON.parse(data);
                if (data.Error === true) {
                    window.location = "/signup";
                }
                $scope.currAsset = $scope.nameMap[$scope.chart.asset];
                $scope.currChartType = $scope.chart.type;
                var timestamp = data[0].Timestamp * 1000;
                interval *= 1000;
                for (var k = 0; k < data[data.length - 1].Predictions.length; k++) {
                    var price = data[data.length - 1].Predictions[k];
                    data[data.length - 1].Predictions[k] = [(timestamp + (k * interval)) - (60 * 60 * 5 * 1000), price];
                }

                $('#chart').highcharts('StockChart', {
                    navigator: {
                        enabled: false
                    },
                    scrollbar: {
                        enabled: false
                    },
                    rangeSelector: {
                        enabled: false
                    },
                    series : [{
                        name : 'Price',
                        data : data[data.length - 1].Predictions,
                        tooltip: {
                            valueDecimals: 6
                        }
                    }]
                });
                $scope.apply();
            }
        });
    }

    $scope.apply = function (cb) {
        if (!$scope.$$phase) {
            $scope.$apply(function () {
                cb ? cb() : "";
            });
        }
    }

}]);