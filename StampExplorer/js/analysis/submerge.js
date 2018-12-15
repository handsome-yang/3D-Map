/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：淹没分析
 * 注意事项：该文件方法仅为淹没分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 ****************************************************************/
var earth,anaysis,htmlBalloon;
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

function getEarth(earthObj){
	earth = earthObj;
	analysis = STAMP.Analysis(earth);
	htmlBalloon = earth.htmlBallon;
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
        analysis.createSubmergePolygon(null,subWaterBottom,waterTop,time,showSide);
        return;
    }
    // 点源分析
    if(pointChecked){
        analysis.submergePoint(subWaterBottom,waterTop,null,showSide);
    }
    // 流域分析
    if(lineChecked){
        analysis.submergeLine(subWaterBottom,waterTop,null,showSide,buffer);
    }
    // 面域分析
    if(polygonChecked){
        analysis.submergePolygons(subWaterBottom,waterTop,null,showSide,buffer);
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
    // 动态模拟
	$("#btnSimulation").click(function(){
		submergeAnalysis(1);
	})
    // 开始分析
	$("#btnStart").click(function(){
		submergeAnalysis(0);
	});
    // 退出
	$("#clear").click(function(){
		analysis.clear();
		htmlBalloon.DestroyObject();
	});
    // 水面边界延伸到地面是否选中
    $("#showSide").click(function(){
        var isShowSide = $("#showSide").is(":checked");
        analysis.showSide(isShowSide);
    })
	window.onunload = function(){
        analysis.clear();
    };
	
})