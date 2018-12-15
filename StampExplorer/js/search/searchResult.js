/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：搜索相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

var divHeight = $("#id_left_operator", parent.document).height() - 180;
$("#dgDiv").height(divHeight);
$("#srcollDiv").height(divHeight - 30);

var earth = parent.earth;
var result = parent.searchResult;

var search = STAMP.Search(earth);
var locationHref = window.location.href;
var idIndex = locationHref.indexOf("?id=");
var id = locationHref.substr(idIndex + 4);

var selectLayerId = top.LayerManagement.selectLayer;
var selectLayer = earth.LayerManager.GetLayerByGuid(selectLayerId);
var layerName = selectLayer.name;
$("#layerSelect").text(layerName);

if(id == "polygon") {
	search.drawPolygon(selectLayerId);
} else if(id == "circle") {
	search.drawCircle(selectLayerId);
} else if(id == "rectangle") {
	search.drawRectangle(selectLayerId);
}
window.onunload = function() {
	search.clearBolloan();
};

//详细信息check
$("#search_info").click(function() {
	var bShow = $(this).attr("checked") == "checked";
	if(!bShow) {
		search.clearBolloan();
	}
});