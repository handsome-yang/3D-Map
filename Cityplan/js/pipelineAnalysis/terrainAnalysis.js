/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：项目附件(类)
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
var isShowResult = false;//是否点击的显示结果按钮
var bShow = false;//是否显示详细信息
var highlightObjectList = [];//分析结果
// 设置按钮状态
function setStatus() {
    var value = $('input[type="radio"][name="radio"]:checked').val();
    if (value == 0) {
        $("#radius").attr("disabled", true);
    } else {
        $("#radius").attr("disabled", false);
    }
    if (value == 1) {
        $("#width").attr("disabled", true);
        $("#height").attr("disabled", true);
    } else {
        $("#width").attr("disabled", false);
        $("#height").attr("disabled", false);
    }
    if (value == 2){
        $("#width").attr("disabled", true);
    }
}
$(function () {
    setDivHeight();
    setStatus();
    var projectId = parent.SYSTEMPARAMS.project;
    earth = parent.earth;
    $("#createTYerrain").click(function () {
        var width = parseFloat($("#width").val());
        var height = parseFloat($("#height").val());
        var radius = parseFloat($("#radius").val());
        var deep = parseFloat($("#deep").val());
        var value = $('input[type="radio"][name="radio"]:checked').val();
        if (value != 0) {
            if (radius <= 0 || isNaN(radius)) {
                alert("请输入正确的半径");
                return;
            }
        }
        if (value != 1) {
            if (width <= 0 || isNaN(width) || height <= 0 || isNaN(height)) {
                alert("请输入正确的宽高");
                return;
            }
        }
        if (isNaN(deep)) {
            alert("请输入埋深");
            return;
        }
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, highlightObjectList);
            $("#showResult").attr("checked", false);
        }


        CreateTunnel.createTunnel(width, height, radius, deep, value, projectId, $("#tblResult>tbody"), $("#showResult"), $("#importExcelBtn"), $("#btnAnalyze"));
    });
    // 分析按钮
    $("#btnAnalyze").click(function () {
        divload("tablediv");
        CreateTunnel.clearHighLight();
        $("#tblResult>tbody").empty();
        $(".needDis").attr("disabled", true);
        $("#showResult").removeAttr("checked");
        setTimeout(function () {
            CreateTunnel.analysisTerrain();
            divloaded();
            if ("" == $("#tblResult>tbody").text()) {
                alert("分析结果为空！");
            }
            $(".needDis").attr("disabled", false);
            $("#detailData").attr("disabled", false);
        }, 100)

    });
    $("input[type='radio']").click(function () {
        setStatus();
    });
    $("#showResult").click(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag, highlightObjectList);
        isShowResult = checkTag;
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    $(window).unload(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, highlightObjectList);
        }
        CreateTunnel.clearTunnelAnaly();
        StatisticsMgr.detachShere();
        CreateTunnel.clearHighLight();
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        LayerManagement.importExcelByTable(tabObj, columns);
    });
    var validation = function () {
        var w = $("#width").val();
        var h = $("#height").val();
        var r = $("#radius").val();
        var d = $("#deep").val();
        if (isNaN(w) || isNaN(h) || isNaN(r) || isNaN(d)) {
            $("#createTYerrain").attr("disabled", true);
        } else {
            $("#createTYerrain").attr("disabled", false);
        }
    }
    $(".txtWidth").keyup(function () {
        validation();
    })
})