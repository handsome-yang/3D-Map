/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：淹没分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2018年03月26日
 *****************************************************************/
var earth,analysis,htmlBalloon;

// 播放频率和升高频率为0或空时提示必须大于0
$("#frequency,#perHeight").change(function() {
    if (!$(this).val() || $(this).val() == 0) {
        $(this).val(0.1)
        alert("该频率值必须大于0");
    }
});

//根据选择的分析类型给input框设置状态
function setStatus(){
    var pointChecked = $("#point").is(":checked");
    if(pointChecked){
        $("#subWaterRadius").attr("disabled",true);
    }else{
        $("#subWaterRadius").attr("disabled",false);
    }
    $("#btnSimulation").attr("disabled",true);
}

function setAnalysisStatus(flag){
    $("#btnStart").attr("disabled",flag);
}

function getEarth(earthObj){
    earth = earthObj;
    analysis = earth.analysisObj;
    htmlBalloon = earth.htmlBallon;
}

//回调函数定义-取消动态模拟按钮禁用
var callbackFunction = function(){
    $("#btnSimulation").attr("disabled",false);
}
//回调函数定义-取消动态模拟按钮禁用
var setArea = function(area){
    $("#subWaterArea").text(area);
}

/*
 * 淹没分析方法
 * @param type type=0代表只是分析，type=1代表动态模拟
 */
function submergeAnalysis(type){
    analysis.clear();
    var subWaterBottom = document.getElementById("subWaterBottom").value;
    var subWaterHeight = document.getElementById("subWaterHeight").value;
    var waterTop= parseInt(subWaterBottom) + parseInt(subWaterHeight);
    var pointChecked = $("#point").is(":checked");
    var lineChecked = $("#line").is(":checked");
    var polygonChecked = $("#polygon").is(":checked");
    var showSide = $("#showSide").is(":checked");
    var buffer = $("#subWaterRadius").val();
    if(type === 1){//动态模拟
        var perHeight = $("#perHeight").val();
        var frequency = $("#frequency").val();
        var speed = perHeight*frequency;
        var time = subWaterHeight/speed;
        analysis.createSubmergePolygon(null,subWaterBottom,waterTop,time,showSide, callbackFunction);
        return;
    }
    // 点源分析
    if(pointChecked){
        analysis.submergePoint(subWaterBottom,waterTop,null,showSide, callbackFunction,$("#subWaterArea"));
    }
    // 流域分析
    if(lineChecked){
        analysis.submergeLine(subWaterBottom,waterTop,null,showSide,buffer, callbackFunction,$("#subWaterArea"));
    }
    // 面域分析
    if(polygonChecked){
        analysis.submergePolygons(subWaterBottom,waterTop,null,showSide,buffer, callbackFunction,$("#subWaterArea"));
    }
}

$(function(){
    setStatus();
    /**
     * 获得高程值
     */
    $("#getAltitude").on("click",function() {
        document.getElementById("getAltitude").style.cursor = "crosshair";
        analysis.getAltitude(function(val){
            $("#subWaterBottom").val(val) ;
        });
        earth.Event.OnLBUp = function(p) {
            document.getElementById("getAltitude").style.cursor ="auto";
            earth.Event.OnLBUp = function() {};
        };
    });

    $("input[type='radio']").click(function(){
        setStatus();
    });
    //动态模拟
    $("#btnSimulation").click(function(){
        submergeAnalysis(1);
    });
    //开始分析
    $("#btnStart").click(function(){
        submergeAnalysis(0);
    });
    //退出
    $("#clear").click(function(){
        analysis.clearHtmlBallon(htmlBalloon);
    });

    window.onunload = function(){
        analysis.clear();
        analysis.clearMenuStyle();
    };
});