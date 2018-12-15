/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：地形平整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth = top.LayerManagement.earth;//三维球
var analysis = STAMP.Analysis(earth);//分析工具对象

//确定按钮事件
function btnclick(){
	//地形平整矢量面点集合
	var vect3s = top.smoothLineV3sArr;
	if(!vect3s || vect3s.length <= 0){//地形平整点集合为空时，使用规划用地线开挖
		vect3s = top.ploygonLayersVcts3[top.projNode.parcelId];
	}
	var depth = Number(document.getElementById("digDepth").value);
	top.digDepth = depth;
    analysis.beginDigLayer(vect3s,depth);
}

//关闭按钮事件
function closebt(){
	top.closeDialog();
	analysis.clear();
}

window.onunload = function(){
	top.closeDialog();
	analysis.clear();
}