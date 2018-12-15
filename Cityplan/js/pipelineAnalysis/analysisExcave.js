/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：开挖分析(节点操作)
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
/**
 * 屏蔽右键菜单
 */
document.oncontextmenu = function() {
    event.returnValue = false;
};
// 改变窗口大小时，结果栏高度自适应
$(window).resize(function(){
    setDivHeight();
});
var earth = null;
var bShow = false;//是否显示详细信息
var isShowResult = false; //是否是点击显示结果按钮
$(function () {
    setDivHeight();
    earth = top.LayerManagement.earth;
    var hideHigh = [];
    var projectId = top.SYSTEMPARAMS.project;
    var excavePolygon = "";
    // 输入框事件
    var validation=function(){
        var txtBufferDist=$("#txtBufferDist").val();
        var txtDepth=$("#txtDepth").val();
        if((!parseInt(txtBufferDist) && parseInt(txtBufferDist) != 0)||(!parseInt(txtDepth) && parseInt(txtDepth) != 0)){
            $("#roadClip").attr("disabled",true);
            $("#customClip").attr("disabled",true);
        }else{
            $("#roadClip").attr("disabled",false);
            $("#customClip").attr("disabled",false);
        }
    }
    // 缓冲半径键盘事件
    $("#txtBufferDist").keyup(function(){
        checkNum($("#txtBufferDist")[0], true, 2, null, null);
        validation();
    });
    // 开挖深度键盘事件
    $("#txtDepth").keyup(function(){
        checkNum($("#txtDepth")[0], true, 2, null, null);
        validation();
    });
    // 沿路开挖
    $("#roadClip").click(function () {
        var depth = $("#txtDepth").val();
        var dist = $("#txtBufferDist").val();
        depth = Number(depth);
        if(depth <= 0 || depth == NaN){
            alert("请输入合理的开挖深度");
            return;
        }
        dist = Number(dist);
        dist = dist == NaN?0:dist;
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            TerrainExcavate.highlightObjectFromTunnel(false) ;
            $("#showResult").attr("checked",false);
        }
        $("#tblResult>tbody").empty();
        $("label#roadInfo").html("");

        var checkTag = $('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.roadClipAnaly(depth,12, dist,projectId,$("#tblResult>tbody"),$("label#roadInfo"),$("#showResult"),$("#importExcelBtn"),checkTag,checkExcave,$("#analysis"));
    });
    // 自定义开挖
    $("#customClip").click(function () {
        var depth = $("#txtDepth").val();
        depth = Number(depth);
        if(depth <= 0 || depth == NaN){
            alert("请输入合理的开挖深度");
            return;
        }
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            TerrainExcavate.highlightObjectFromTunnel(false) ;
            $("#showResult").attr("checked",false);
        }
        $("#tblResult>tbody").empty();
        $("label#roadInfo").html("");

        var checkTag =$('input:checkbox[name="checkInfo"]').is(":checked");
        var checkExcave =$('input:checkbox[name="checkExcave"]').is(":checked");
        TerrainExcavate.customClipAnaly(depth, 12,projectId,$("#tblResult>tbody"),$("label#roadInfo"),$("#showResult"),$("#importExcelBtn"),checkTag,checkExcave,$("#analysis"));
    });
    //分析点击事件
    $("#analysis").click(function(){
        divload("tablediv");
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            TerrainExcavate.highlightObjectFromTunnel(false) ;
            $("#showResult").attr("checked",false);
        }
        $("#tblResult>tbody").empty();
        TerrainExcavate.roadAnalysis();
        if(""==$("#tblResult>tbody").text()){
            alert("分析结果为空！");
        }
        divloaded();
        $("#detailData").attr("disabled",false); 
    });
    // 显示结果
    $("#showResult").click(function (){
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            isShowResult = true;
            checkTag ="true";
            TerrainExcavate.highlightObjectFromTunnel(checkTag) ;
        } else {
            TerrainExcavate.highlightObjectFromTunnel(false) ;
        }
        isShowResult = false;
    });
    //显示详细信息
    $("#detailData").click(function(){
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if(!bShow){
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function(){
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号","类型","图层"];
        StatisticsMgr.importExcelByTable(tabObj,columns);
    });
    $(window).unload(function () {
        var checkTag=$('input:checkbox[name="showResult"]').is(":checked");
        if(checkTag){
            TerrainExcavate.highlightObjectFromTunnel(false) ;
        }
        TerrainExcavate.deleteTempTerrainAnaly();
        TerrainExcavate.clearHighLight();
        StatisticsMgr.detachShere();
    });
});