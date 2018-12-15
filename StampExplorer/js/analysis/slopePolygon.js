/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：坡度图
 * 注意事项：该文件方法仅为坡度图使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 ****************************************************************/
var earth = null;
var analysis = null;
// 获取三维球对象
function getEarth(earthObj) {
    earth = earthObj;
    analysis = STAMP.Analysis(earth);
}
$(function () {
    $("#tableLines").mCustomScrollbar();
    $("#slopeTable td").css({
    	"width": "60px",
    	"white-space": "nowrap",
    	"overflow": "hidden",
    	"word-break": "keep-all"
    });
    // 绘制按钮，选定范围面
    $("#draw").click(function(){
    	//记录设置的颜色
    	var setColor = [];
    	$(".colorInput").each(function() {
    		setColor.push(this.value);
    	});
        analysis.slope(setColor);
    });
    // 分段按钮，将量出的坡度平均分为几段
    $('#sectionBtn').on('click', function (e) {
        analysis.section();
    });
    // 分析按钮，根据不同的坡度渲染相应的颜色
    $('#btnStart').on('click', function (e) {
        analysis.colorPolygon(slopePolygonObj);
    });
    // 退出按钮
    $('#cancel').on('click', function (e) {
        analysis.clear();
        earth.htmlBallon.DestroyObject();
    });
    
    window.onunload = function () {
        analysis.clear();
    }
});

