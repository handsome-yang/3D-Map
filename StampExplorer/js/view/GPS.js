/**
 * 作       者：StampGIS Team
 * 创建日期：2017年9月30日
 * 描        述：GPS相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月7日
 ******************************************/
var earth = parent.earth; //全局earth

/**
 * 增加连接
 */
function addLink() {
	var filePath = earth.UserDocument.SaveFileDialog("", "*.nmea", "nmea");
	if(filePath == "")
		return;
	document.getElementById("path").value = filePath;
	$("#btnEnter").attr("disabled", false);
}

/**
 * 打开连接
 */
function openLink() {
	var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "*.nmea");
	if(filePath == "")
		return;
	document.getElementById("hisPath").value = filePath;
	$("#btnEnter").attr("disabled", false);
}



$(function() {
	var trackManager = STAMP.TrackManager(earth);
	var divHeight = $(parent.document).height() - 500;

	//实时跟踪
	$("#lbItem").click(function() {
		$("#path").attr("disabled", "disabled");
		$("#time").removeAttr("disabled");
		$("#nema,#selComPort,#btnGetComPort").removeAttr("disabled");
		$("#hisPath").removeAttr("disabled");
	});
	
	

	//历史轨迹
	$("#xyItem").click(function() {
		$("#hisPath").attr("disabled", "disabled");
		$("#time").attr("disabled", "disabled");
		$("#nema,#selComPort,#btnGetComPort").attr("disabled", "disabled");
		$("#path").removeAttr("disabled");

	});
	$("#dgDiv").height(divHeight);
	// 初始化动态对象列表
	trackManager.getDynamicObject(null, function(fly) {
		$("#selDynamicObj").append('<option value="' + fly.Guid + '">' + fly.Name + '</option>');
	});
	$("#lbItem ").click(function() {
		$(this).removeAttr("checked");
		$("#xyItem ").removeAttr("checked");
		$(this).attr("checked", "checked");
		$("#geo").removeAttr("disabled");
		$("#path").removeAttr("disabled");
		$("#pathSel").removeAttr("disabled");
		$("#shadow").attr("disabled", "disabled");
		$("#hisPath").attr("disabled", "disabled");
		$("#hisPathSel").attr("disabled", "disabled");
	});
	$("#xyItem ").click(function() {
		$(this).removeAttr("checked");
		$("#lbItem ").removeAttr("checked");
		$(this).attr("checked", "checked");
		$("#shadow").removeAttr("disabled");
		$("#hisPath").removeAttr("disabled");
		$("#hisPathSel").removeAttr("disabled");
		$("#geo").attr("disabled", "disabled");
		$("#path").attr("disabled", "disabled");
		$("#pathSel").attr("disabled", "disabled");
	});
	$("#chkDynamic").click(function() {
		var lbItem = $('input:checkbox[name="chkDynamic"]').is(":checked");
		if(lbItem) {
			$("#dynamicDiv").removeAttr("disabled");
		} else {
			$("#dynamicDiv").attr("disabled", "disabled");
		}

	});
	// region 动态物体
	var track = null; //路径
	var time; //控制连接状态标签

	/**
	 * 获取GPS跟踪
	 * @param {Object} path  路径
	 */
	function getGPSTrack() {
		if(track){
			return;
		}
		var GPSTrackGuid = earth.Factory.CreateGUID();
		var GPSTrackName = $("#dynamicName").val()?$("#dynamicName").val():$("#selDynamicObj").val();
		track = earth.Factory.CreateGPSTrack(GPSTrackGuid, GPSTrackName);
	}

	/**
	 * 获取端口
	 */
	$("#btnGetComPort").click(function()  {
		$("#selComPort").empty();
		getGPSTrack();
		if(track){
			var count = track.GetComPortCount();
			for(var i = 0; i < count; ++i){
				var comName = track.GetComPortName(i);
				$("#selComPort").append('<option value="' + comName + '">' + comName + '</option>');
			}
		}
	});

	/**
	 * 开始
	 */
	$("#btnEnter").click(function() {
		$("#checkBntn div", window.top.document).attr("disabled", true);
		var lbItem = $('input:radio[name="lbItem"]').is(":checked");
		var xyItem = $('input:radio[name="xyItem"]').is(":checked");
		var dynamicChk = $('input:checkbox[name="chkDynamic"]').is(":checked");
		if(lbItem) {
			if($("#dynamicName").val() === "") {
				alert("对象名称不能为空");
				return;
			} else if($("#nema").val() === "") {
				alert("数据协议不能为空");
				return;
			} else if($("#time").val() === "" || $("#time").val() <= 0) {
				alert("轮询间隔不能为空和小于零");
				return;
			} else if($("#path").val() === "") {
				alert("存储路径不能为空");
				return;
			} else if($("#selComPort").val() === "") {
				alert("com端口不能为空");
				return;
			}
			$("#nema,#time,#path,#geo,#lbItem,#selComPort,#btnGetComPort").attr("disabled", "disabled");
		} else if(xyItem) {
			if($("#dynamicName").val() === "") {
				alert("对象名称不能为空");
				return;
			} else if($("#hisPath").val() === "") {
				alert("选择文件路径不能为空");
				return;
			}
			$("#hisPath,#xyItem,#xyChk,#shadow").attr("disabled", "disabled");
		} else if(dynamicChk) {
			$("#chkDynamic,#dynamicDiv,#dChk").attr("disabled", "disabled");
		}
		$("#xyItem,#chkDynamic,#lbItem,#xyChk,#dChk,#GPSChecked").attr("disabled", "disabled");
		if($(this).text() == "开始") {
			$(this).text("暂停");
			//GPS轨迹自然状态下完成
			earth.Event.OnGPSTrackFinished = function() {
				$("#checkBntn div", window.top.document).attr("disabled", false);
				clearInterval(time);
				var lbItem = $('input:radio[name="lbItem"]').is(":checked");
				var xyItem = $('input:radio[name="xyItem"]').is(":checked");
				var dynamicChk = $('input:checkbox[name="chkDynamic"]').is(":checked");
				if(lbItem) {
					$("#nema,#time,#path,#geo,#lbItem,#selComPort,#btnGetComPort").removeAttr("disabled");
				} else if(xyItem) {
					$("#hisPath,#xyItem,#xyChk,#shadow").removeAttr("disabled");
				} else if(dynamicChk) {
					$("#chkDynamic,#dynamicDiv,#dChk").removeAttr("disabled");
				}
				$("#xyItem,#chkDynamic,#lbItem,#xyChk,#dChk,#GPSChecked").removeAttr("disabled");
				$("#comList").empty();
				$("#btnStop").attr("disabled", "disabled");
				$("#btnEnter").text("开始");
				$("#selDynamicObj").removeAttr("disabled");
				$("#btnEnter").removeAttr("disabled");
				if(track) {
					track.Stop();
					earth.DynamicSystem.UnLoadDynamicObject(track.BindObject); //卸载运动物体对象
				}
				track = null;
			};

			earth.Event.OnDocumentChanged = function(type, guid) {
				if(type != "3") {
					getGPSTrack();	
					if(lbItem) {
						track.DataType = 1;//1.从串口获取数据，2.从文件获取数据，3.使用AddGps手动传入数据
						track.TrackType = 1;//跟随模式
						track.HeightType = 1;//高程模式，1贴地
						track.OutputPathName = $("#path").val(); // nmea文件存储位置，存放接收到的GPS信息
						track.QueryInterval = $("#time").val(); // 从GPS获取数据的时间间隔，单位:秒
						track.BindObject = guid;
						track.ShowName = true;
						track.InitFollowTrack(180, 15, 1, 5);
						/*xjh 改为按指定端口获取gps信号*/
						track.ComPortName = $("#selComPort").val();
						
						//xianshi未连接的初始状态，setInterval时间调成很小也可，效果不明显
						$("#dgDiv").html('<div style="margin:10px;"><label>' + track.ConnectInformation + '</label></div>');
						time = setInterval(function() {
							var conectTag = track.ConnectInformation;
							conectTag = conectTag + "....";
							$("#dgDiv").html('<div style="margin:10px;"><label>' + conectTag + '</label></div>');
						}, 600);
					} else {
						track.DataType = 2;//读取文件的方式
						track.TrackType = 1;//跟随模式
						track.HeightType = 1;//高程模式,1贴地
						track.SourcePathName = $("#hisPath").val();
						track.BindObject = guid;
						track.InitFollowTrack(180, 15, 1, 5);
						track.ShowName = true;
					}
					track.Play();
					earth.GPSTrackControl.SetMainTrack(track.guid, 3); //跟随模式1:一人称视角和3：三人称
					$("#btnStop").removeAttr("disabled");
				}
			}
			earth.DynamicSystem.LoadDynamicObject($("#selDynamicObj").val());
		} else if($(this).text() == "暂停") {
			$(this).text("继续");
			track.Pause();
		} else {
			$(this).text("暂停");
			track.Resume();
		}
	});
	$("#btnStop").click(function() {
		$("#checkBntn div", window.top.document).attr("disabled", false);
		clearInterval(time);
		var lbItem = $('input:radio[name="lbItem"]').is(":checked");
		var xyItem = $('input:radio[name="xyItem"]').is(":checked");
		var dynamicChk = $('input:checkbox[name="chkDynamic"]').is(":checked");
		if(lbItem) {
			$("#nema,#time,#path,#geo,#lbItem,#selComPort,#btnGetComPort").removeAttr("disabled");
		} else if(xyItem) {
			$("#hisPath,#xyItem,#xyChk,#shadow").removeAttr("disabled");
		} else if(dynamicChk) {
			$("#chkDynamic,#dynamicDiv,#dChk").removeAttr("disabled");
		}
		$("#xyItem,#chkDynamic,#lbItem,#xyChk,#dChk,#GPSChecked").removeAttr("disabled");
		$("#dgDiv").empty();
		$("#btnStop").attr("disabled", "disabled");
		$("#btnEnter").text("开始");
		$("#selDynamicObj").removeAttr("disabled");
		$("#btnEnter").removeAttr("disabled");
		if(track) {
			track.Stop();
			trackManager.out(track.BindObject);
			track = null;
		}
	});

	window.onunload = function() {
		if(time) {
			clearInterval(time); //关闭定时器
		}
		if(track) {
			track.Stop();
			trackManager.out(track.BindObject);
			track = null;
		}
	};
});