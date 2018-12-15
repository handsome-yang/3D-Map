/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：阴影分析
 * 注意事项：该文件方法仅为阴影分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 ****************************************************************/
var earth="";
var analysis;
var startShingTime = "";
var endShingTime ="";
function getEarth(earthObj){
    earth = earthObj;
    analysis = earth.analysisObj;
    var timer;
    var setDateTime = function(now){
        var year = now.getFullYear();
        var month = now.getMonth()+1;
        if(month < 10){
            month = "0"+month
        }
        var day = now.getDate();
        if(day < 10){
            day = "0"+day
        }
        var hour = now.getHours();
        if(hour < 10){
            hour = "0"+hour
        }
        var minute = now.getMinutes();
        if(minute < 10){
            minute = "0"+minute
        }
        var second = now.getSeconds();
        if(second < 10){
            second = "0"+second
        }
        $("#dqdate").val(year + "-" + month + "-" + day);
        $("#time").val(hour + ":" + minute);
    };

    $(function (){
        setDateTime(new Date());
        $("#datediv").attr("disabled",false) ;
        $("#time").attr("disabled",false) ;
        var rsl = null;
        var clearArr = [];
        var clear = function (){
            if (rsl) {
                rsl.ClearRes();
                rsl = null;
            }
            if(clearArr.length>0){
                for(var i=0;i<clearArr.length;i++){
                    if(clearArr[i]){
                        clearArr[i].ClearRes();
                    };
                }
                clearArr = [];
            }
        };
        var longitude = earth.GlobeObserver.TargetPose.Longitude;
        var latitude = earth.GlobeObserver.TargetPose.latitude;
        var currDateArr =$("#dqdate").val().split("-");
        var shineTime = earth.GeometryAlgorithm.CalculateSunriseAndSunset(currDateArr[0], currDateArr[1], currDateArr[2],longitude, latitude);
        startShingTime = timeEdit(shineTime.X);
        endShingTime = timeEdit(shineTime.Y);
        $("#spanTime").val(startShingTime+"  至 "+endShingTime);
        var nowTime = $("#time").val().split(":");
        var st =Number(nowTime[0])+Number(nowTime[1])/60;

        if(st>=Number(shineTime.X)&&st<=Number(shineTime.Y)){
            $("#btnStartAnalysis").removeAttr("disabled");
        }
        var btn1 = [$("#btnSimulate"),$("#datediv"),$("#time"),$("#step"),$("#interval"),$("#btnStartAnalysis"),$("#clear")];
        var btn2 = $("#btnStop");
        var dqdate =$("#dqdate");
        // 开始或结束分析
        $("#btnStartAnalysis").click(function (){
            $("#btnStartAnalysis").attr("disabled","disabled") ;
            $("#btnSimulate").attr("disabled","disabled") ;
            $("#clear").attr("disabled","disabled") ;
            $("#datediv").attr("disabled","disabled") ;
            $("#time").attr("disabled","disabled") ;
            $("#step").attr("disabled","disabled") ;
            $("#interval").attr("disabled","disabled") ;

            analysis.shadow(btn1,btn2,dqdate);
        });
        $("#btnStop").click(function(){
            clear();
            clearInterval(timer);
            setDateTime(new Date());
            $("#btnSimulate").attr("disabled", "disabled");

            $("#btnStop").attr("disabled", "disabled");

            $("#btnStartAnalysis").removeAttr("disabled");
            $("#datediv").removeAttr("disabled");
            $("#time").removeAttr("disabled");

            $("#step").removeAttr("disabled");
            $("#interval").removeAttr("disabled");
        });
        // 开始或取消动态模拟
        $("#btnSimulate").click(function (){
            moni(true);
        });
        var endTimeTag = "";
        function moni(tag){   //tag 判断阴影分析是否动态分析
            if($("#btnSimulate").text() == "动态模拟"){
                $("#btnSimulate").text("取消模拟")
                $("#btnStartAnalysis").attr("disabled","disabled");
                $("#clear").attr("disabled","disabled");
                var dates = $("#dqdate").val().split("-");
                var times = $("#time").val().split(":");
                var curDate = new Date(dates[0],dates[1]-1,dates[2],times[0],times[1],00);
                curDate.setTime(curDate.getTime() + $("#step").val() * 60 * 1000);
                setDateTime(curDate);
            }else{
                $("#btnSimulate").text("动态模拟");
                $("#btnSimulate").attr("disabled","disabled");
                setDateTime(new Date());
                $("#btnStartAnalysis").removeAttr("disabled");
                $("#clear").removeAttr("disabled");

                clear();
                tag = false;
            }
            analysis.simulation(btn1,btn2,dqdate,startShingTime,endShingTime);
        }
        setInterval(function(){
            if(endTimeTag>endShingTime&&$("#btnSimulate").text()=="取消模拟"){
                $("#btnSimulate").text("动态模拟");
                $("#btnStartAnalysis").removeAttr("disabled");
                $("#clear").removeAttr("disabled");
                $("#timeSlider").slider("enable");
                clearInterval(timer);
            }
        },$("#interval").val());

        $("#clear").click(function(){
            analysis.clear();
            analysis.clearHtmlBallon(earth.htmlBallon);
        });
        window.onunload=function(){
            analysis.clear();
        };
        $("#clear").removeAttr("disabled");
    });
    $("#time").bind("propertychange", function(){
        var longitude = earth.GlobeObserver.TargetPose.Longitude;
        var latitude = earth.GlobeObserver.TargetPose.latitude;
        var currDateArr =$("#dqdate").val().split("-");
        var shineTime = earth.GeometryAlgorithm.CalculateSunriseAndSunset(currDateArr[0], currDateArr[1], currDateArr[2],longitude, latitude);
        startShingTime = timeEdit(shineTime.X);
        endShingTime = timeEdit(shineTime.Y);
        var nowTime = $("#time").val().split(":");
        var st =Number(nowTime[0])+Number(nowTime[1])/60;
        if(st>=Number(shineTime.X)&&st<=Number(shineTime.Y)){
            $("#btnStartAnalysis").removeAttr("disabled");
        }
        else{
            $("#btnStartAnalysis").attr("disabled","disabled") ;
        }
    });
    $("#step").change(function(){
        if( $("#step").val() <= 0||isNaN($("#step").val())){
            $("#btnStartAnalysis").attr("disabled","disabled") ;
            alert("分析步长必须是大于0的数字！");
        }
        else{
            $("#btnStartAnalysis").removeAttr("disabled");
        }
    });
    $("#step").trigger("change");
}
function cDayChange(){
    var longitude = earth.GlobeObserver.TargetPose.Longitude;
    var latitude = earth.GlobeObserver.TargetPose.latitude;
    var currDateArr =$("#dqdate").val().split("-");
    var shineTime = earth.GeometryAlgorithm.CalculateSunriseAndSunset(currDateArr[0], currDateArr[1], currDateArr[2],longitude, latitude);
    startShingTime = timeEdit(shineTime.X);
    endShingTime = timeEdit(shineTime.Y);
    $("#spanTime").val(startShingTime+"  至 "+endShingTime);
    var nowTime = $("#time").val().split(":");
    var st =Number(nowTime[0])+Number(nowTime[1])/60;
    if(st>=Number(shineTime.X)&&st<=Number(shineTime.Y)){
        $("#btnStartAnalysis").removeAttr("disabled");
    }
    else{
        $("#btnStartAnalysis").attr("disabled","disabled") ;
    }
}
function timeEdit(timeSE){
    var time = timeSE+"";
    time = time.split(".");
    var str = "";
    if(time.length>0){
        if(time.length===2){
            var timeZero = Number(timeSE)-Number(time[0]);
            var miniter = parseInt(timeZero*60);
            if(miniter<10){
                str = time[0]+":0"+miniter;
            } else{
                str = time[0]+":"+miniter;
            }

        } else if(time.length===1){
            str = time[0]+":"+"00";
        }
    }
    return str;
}