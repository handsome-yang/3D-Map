/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：定点观察
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
/**
 * 驱动事件
 * @param earthObj,三维球对象
 */
function getEarth(earthObj){
    var analysis = earthObj.analysisObj;
    var btn = [$("#btnStart"),$("#height"),$("#clear")];

    $("#btnStart").click(function(){
        if($("#btnStart").text()==="开始分析"){
            $("#btnStart").attr("disabled","disabled");
            analysis.fixedObserver($("#height").val(),btn);

            $("#height").attr("disabled","disabled") ;
            $("#clear").attr("disabled","disabled") ;
        }
    });

    $("#clear").click(function(){
        analysis.clearMenuStyle();
        analysis.clearHtmlBallon(earthObj.htmlBallon);
    });

    window.onunload=function(){
        analysis.clear();
    };
}
