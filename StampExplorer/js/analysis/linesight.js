/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：通视分析
 * 注意事项：该文件方法仅为通视分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/
function getEarth(earthObj) {
    var analysis = earthObj.analysisObj;
    var btn = [$("#btnStart"), $("#endHeight"), $("#startHeight"), $("#showHeight"), $("#clear")];
    // 分析按钮
    $("#btnStart").click(function () {
        if ($("#startHeight").val() == "" || $("#endHeight").val() == "") {
            alert("高度不能为空");
            return false;
        }
        if (isNaN($("#startHeight").val())) {
            alert("请输入数字");
            return false;
        }
        if ($("#startHeight").val() > 100) {
            alert("起点高度和目标高度不能超过100米");
            return false;
        }
        if ($("#startHeight").val() <= 0) {
            alert("起点高度和目标高度不能小于或等于0");
            return false;
        }

        if (isNaN($("#endHeight").val())) {
            alert("请输入数字");
            return false;
        }

        if ($("#endHeight").val() > 100) {
            alert("起点高度和目标高度不能超过100米");
            return false;
        }
        if ($("#endHeight").val() <= 0) {
            alert("起点高度和目标高度不能小于或等于0");
            return false;
        }
        if (check()) {
            $("#btnStart").attr("disabled", "disabled");
            $("#endHeight").attr("disabled", "disabled");
            $("#startHeight").attr("disabled", "disabled");
            $("#showHeight").attr("disabled", "disabled");
            $("#clear").attr("disabled", "disabled");
            analysis.lineOfSight(startHeight.value, endHeight.value, btn);
        }
    });
    // 退出按钮
    $("#clear").click(function () {
        analysis.clearHtmlBallon(earthObj.htmlBallon);
    });
    // 显示高度 按钮
    $("#showHeight").click(function () {
        analysis.showHeightLine();
    });
    window.onunload = function () {
        analysis.clear();
        earthObj.Event.OnPickObjectEx = function () {
        };
        earthObj.Event.OnPickObject = function () {
        };
        earthObj.Event.OnLBDown = function () {
        };
        earthObj.Event.OnLBUp = function () {
        };
        earthObj.Query.FinishPick();
        earthObj.Environment.SetCursorStyle(209);
    };
}

// 对value值进行判断
function check() {
    if (isNaN($("#startHeight").val()) == true) {
        alert("无效的起点高度");
        startHeight.select();
        startHeight.focus();
        return false;
    }
    if (isNaN($("#endHeight").val()) == true) {
        alert("无效的目标高度");
        endHeight.select();
        endHeight.focus();
        return false;
    }
    return true;
}