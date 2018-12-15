/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：审批纪要
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
// 会议时间
var setDateTime = function (now) {
    var year = now.getFullYear();
    var month = now.getMonth();
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    month = parseInt(month) + 1;
    if (month < 10) {
        month = "0" + month;
    }
    if (parseInt(day) < 10) {
        day = "0" + day;
    }
    $("#date").val(year + "-" + month + "-" + day);
};

setDateTime(new Date());
var planTag = "";
var earth = "";
var finishApprove = null;
function getEarth(earthObj) {
    earth = earthObj;
    var projManager = earth.projManager;
    var proId = earth.projNodeId;
    var projData = projManager.getProjectData({id: proId});
    var proData = projManager.getPlanData(proId);
    var ConferenceData = projManager.getAllConferenceData(proId);
    var planArr = [];
    finishApprove = earth.finishApprove;
    if (ConferenceData && ConferenceData.length) {//如果已经审批 则不允许操作！
        $("#name").attr("disabled", "disabled");
        $("#plan").attr("disabled", "disabled");
        $("#person").attr("disabled", "disabled");
        $("#written").attr("disabled", "disabled");
        $("#date").datebox({disabled: true}); 
    }
    $("#name").val(projData[0]["CPPROJECT.NAME"]);
    for (var i = 0; i < proData.length; i++) {
        var opt = document.createElement("OPTION");
        opt.value = proData[i]["CPPLAN.ID"];
        opt.text = proData[i]["CPPLAN.NAME"];
        if (ConferenceData.length > 0) {
            if (proData[i]["CPPLAN.ID"] === ConferenceData[0]["CPCONFERENCE.PASSEDPLANID"]) {
                opt.selected = true
                planTag = proData[i]["CPPLAN.ID"];
            }
        }
        if ($.inArray(opt.value, planArr) == -1) {
            planArr.push(opt.value);
            //选中已通过审核的方案
            if (opt.selected) {
                $('#plan').append('<option value="' +
                    opt.value + '" server="' + opt.value + '" selected="selected">' +
                    opt.text + '</option>')
            } else {
                $("#plan").append('<option value="' +
                    opt.value + '" server="' + opt.value + '">' +
                    opt.text + '</option>');
            }
        }
    }
    $("#confirm").attr("disabled", "disabled");
    if (ConferenceData.length > 0) {
        var timestr = ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(0, 4) + "-" + ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(4, 6) + "-" +
            ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(6, 8);
        $("#date").val(timestr);
        $("#written").val(ConferenceData[0]["CPCONFERENCE.DETAIL"]);
        $("#person").val(ConferenceData[0]["CPCONFERENCE.STAFF"]);
    }
    $("#plan").change(function () {
        if ($("#plan").val() === planTag) {
            var timestr = ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(0, 4) + "-" + ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(4, 6) + "-" +
                ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(6, 8);
            $("#date").val(timestr);
            $("#written").val(ConferenceData[0]["CPCONFERENCE.DETAIL"]);
            $("#person").val(ConferenceData[0]["CPCONFERENCE.STAFF"]);
        } else {
            $("#date").val("");
            setDateTime(new Date());
            $("#written").val("");
            $("#person").val("");
        }
        if ($("#plan").val() == "请选择通过的方案") {
            $("#confirm").attr("disabled", "disabled");
        } else {
            $("#confirm").removeAttr("disabled");
        }
    });
    $("#confirm").click(function () {
        var time = $("#date").datebox("getValue").split("-");
        var timeStr = time[0] + time[1] + time[2];
        var planId = $("#plan").val();
        var person = $("#person").val();
        var jilu = $("#written").val();
        projManager.updateStatus(proId, 1);
        if ($("#plan").val() === planTag) {
            projManager.updateConference(proId, planId, timeStr, person, jilu);
        } else {
            projManager.saveConference(proId, planId, timeStr, person, jilu);
        }
        if(typeof finishApprove == "function") {
            finishApprove();
        }
        var Tools = earth.Tools;
        if(Tools){
            Tools.singleStyleCancel("approveTag");
        }
        if (earth.htmlBallon != null) {
            earth.htmlBallon.DestroyObject();
            earth.htmlBallon = null;
        };

    });
    $("#close").click(function () {
        var Tools = earth.Tools;
        if(Tools){
            Tools.singleStyleCancel("approveTag");
        }
        if (earth.htmlBallon != null) {
            earth.htmlBallon.DestroyObject();
            earth.htmlBallon = null;
        };
    });
}
$(function () {
	var querys = (window.location.search.length >0 ? window.location.search.substring(1):"");
	if(querys){
		var itemType = querys.split("=");
		if (itemType[1] == 2) {
			document.title = "已审批纪要";
		}
	}
});
// 方案通过气泡显示界面
function getEarthFinished(earthObj) {
	//界面禁用
    $("#name").attr("disabled", "disabled");
    $("#plan").attr("disabled", "disabled");
    $("#person").attr("disabled", "disabled");
    $("#written").attr("disabled", "disabled");
    //解决禁用日期按钮宽度变窄问题
	$("#date").datebox({disabled:true});
	$(".datebox").css("width","404px");
	$(".combo-text").css("width","376px");

    $("#confirm").attr("disabled", "disabled");

    earth = earthObj;
    var projManager = earth.projManager;
    var proId = earth.projNodeId;
    var projData = projManager.getProjectData({id: proId});
    var planData = projManager.getPlanData(proId);//方案
    var ConferenceData = projManager.getAllConferenceData(proId);//
    for (var i = 0, len = planData.length; i < len; i++) {
        var option = document.createElement("OPTION");
        if (planData[i]["CPPLAN.ID"] == ConferenceData[0]["CPCONFERENCE.PASSEDPLANID"]) {
            option.value = planData[i]["CPPLAN.ID"];
            option.text = planData[i]["CPPLAN.NAME"];
            $('#plan').append('<option value="' +
                option.value + '" server="' + option.value + '" selected="selected">' +
                option.text + '</option>')
            break;
        }
    }
    $("#name").val(projData[0]["CPPROJECT.NAME"]);
    if (ConferenceData.length > 0) {
        var timestr = ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(0, 4) + "-" + ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(4, 6) + "-" + ConferenceData[0]["CPCONFERENCE.CONFDATE"].substring(6, 8);
        $('#date').datebox("setValue", timestr);
        $("#written").val(ConferenceData[0]["CPCONFERENCE.DETAIL"]);
        $("#person").val(ConferenceData[0]["CPCONFERENCE.STAFF"]);
    } else {
        $("#date").val("");
        $("#written").val("");
        $("#person").val("");
    }

    $("#close").click(function () {
        if (earth.htmlBallon != null) {
            earth.htmlBallon.DestroyObject();
            earth.htmlBallon = null;
        }
    });
}
