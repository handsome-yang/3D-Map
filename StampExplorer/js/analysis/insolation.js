/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：日照分析
 * 注意事项：该文件方法仅为日照分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/
var earth="";
var analysis;
var startShingTime = "";
var endShingTime ="";
var htmlBalloon = null;//分析气泡

$(function(){
    updateUI();
    window.onunload = function(){
        analysis.clear();
    }
    $("#clear").click(function () {
       analysis.clear();
       if(htmlBalloon) {
           htmlBalloon.DestroyObject();
           htmlBalloon = null;
       }
    });
});
//将时间转换为8:09格式
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
//日期change事件
function cDayChange(){
    var longitude = earth.GlobeObserver.TargetPose.Longitude;
    var latitude = earth.GlobeObserver.TargetPose.latitude;
    var currDateArr =$("#dqdate").val().split("-");
    var shineTime = earth.GeometryAlgorithm.CalculateSunriseAndSunset(currDateArr[0], currDateArr[1], currDateArr[2],longitude, latitude);
    startShingTime = timeEdit(shineTime.X);
    endShingTime = timeEdit(shineTime.Y);
    $("#extent").val(startShingTime + "-" + endShingTime);
}

function updateUI() {
    var dateVar = $("#date").val();

    if ( dateVar == "0"){
        var time = new Date();
        var dahan = time.getFullYear()+'-'+'01'+'-'+'20';//大寒日固定为每年的1月20日

        //进入页面后时间空间的值被还原了，在这里设置延迟修改
        setTimeout(function(){
            $("#dqdate").val(dahan);
        }, 100);

        $("#dqdate").off().on("focus",function(){
            WdatePicker({startDate:dahan});
        });
        $("#extent").val("8:00-16:00");
        $("#dqdate").attr('disabled',true);
        $("#extent").attr("disabled", true) ;
    }else if (dateVar == "1"){
        $("#dqdate").attr('disabled',true);
        $("#extent").attr("disabled", true);
        var time = new Date();
        var dongzi = time.getFullYear()+'-'+'12'+'-'+'22';//冬至日固定为每年的12月22日

        $("#dqdate").val(dongzi);
        $("#dqdate").off().on("focus",function(){

            WdatePicker({startDate:dongzi});
        });
        $("#extent").val("9:00-15:00");
    }else if (dateVar == "2"){
        var time = new Date();
        var today = time.getFullYear()+'-'+ (time.getMonth()+1) +'-'+ time.getDate();
        $("#dqdate").val(today);
        $("#dqdate").attr('disabled',false);
        $("#extent").attr("disabled", true);
        cDayChange();
    }

    var statVar = $("#statType").val();
    if (statVar == "0"){
        $("#accType").attr('disabled',false);
    }
    else{
        $("#accType").attr('disabled',true);
    }
}

function getEarth(earthObj){
    earth = earthObj;
    analysis = earth.analysisObj;
    htmlBalloon = earthObj.htmlBallon;
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
    };
    $(function (){
        setDateTime(new Date());
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

        // 开始或结束分析  
        $("#btnStartAnalysis").click(function (){

            $("#btnStartAnalysis").attr("disabled","disabled") ;
            $("#step").attr("disabled","disabled") ;
            var currDateArr =$("#dqdate").val().split("-");

            var strTest= $("#extent").val();

            var arrTest=strTest.replace(" ","").split("-");

            var beginNum=parseInt(arrTest[0].split(":")[0]*60)+parseInt(arrTest[0].split(":")[1]);
            var endNum=parseInt(arrTest[1].split(":")[0]*60)+parseInt(arrTest[1].split(":")[1]);
            var singlePoint = $("#type").val() == 0 ? true : false;
            analysis.insolation($("#btnStartAnalysis"),$("#lightime"),currDateArr[1], currDateArr[2], beginNum, endNum, $("#statType").val() == "0" ? true : false, $("#accType").val(), singlePoint, $("#step"));
        });
    });
}

function editDate(){
    updateUI();
}

function editStatType(){
    updateUI();
}