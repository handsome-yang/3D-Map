/**
 * 作    者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描    述：关键字查询相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/
//界面调整
$(window).resize(function(){
	var divHeight = $("#id_left_operator", parent.document).height() - 250;
	$("#dgDiv").height(divHeight);
	$("#srcollDiv").height(divHeight - 30);
	$("#srcollDiv").mCustomScrollbar({}); //滚动条
})
$(function(){
	var divHeight = $("#id_left_operator", parent.document).height() - 250;
	$("#dgDiv").height(divHeight);
	$("#srcollDiv").height(divHeight - 30);
	$("#srcollDiv").mCustomScrollbar({}); //滚动条
	$("#layerSelected").text(layerName);
	//关键字搜索
	$("#searchBtn").click(function() {
		search.keyWordSearch(selectLayerId);
	});
	//详细信息check
	$("#search_info").click(function() {
		var bShow = $(this).attr("checked") == "checked";
		if(!bShow) {
			search.clearBolloan();
		}
	});
})
var earth = parent.earth; //全局earth
var search = STAMP.Search(earth);
search.loadSearch(earth);

//给select添加poi图层
var projectId = top.SYSTEMPARAMS.project;
var selectLayerId = top.LayerManagement.selectLayer;
var selectLayer = earth.LayerManager.GetLayerByGuid(selectLayerId);
var layerName = selectLayer.name;

window.onunload = function() {
	search.clearBolloan();
};
