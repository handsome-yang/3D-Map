/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：视野分析
 * 注意事项：该文件方法仅为视野分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 ****************************************************************/
var earth = "";
function getEarth(earthObj) {
    earth = earthObj;
    var analysis = STAMP.Analysis(earth);
    $(function () {
        $("#btnStart").click(function () {
            $("#btnStart").attr("disabled", "disabled");
            analysis.fixedObserver($("#height").val());
            $("#height").attr("disabled", "disabled");
            $("#clear").attr("disabled", "disabled");
        });
    });
    $("#clear").click(function () {
        analysis.clearHtmlBallon(earth.htmlBallon);
    });
    $("#height").change(function () {
        if (isNaN($("#height").val())) {
            $("#btnStart").attr("disabled", "disabled");
            alert("观察高度必须是数字！");
        }
        else {
            $("#btnStart").removeAttr("disabled");
        }
    });
    $("#height").trigger("change");
    window.onunload = function () {
        analysis.clear();
    };
}