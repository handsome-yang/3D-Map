/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：街景浏览相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月7日
 ******************************************/

var earth; //三维球
var lastEdit = null; //最后编辑
var streetViewPose = {}; //街景
var trackManager = null; //路径管理
var treeTrack = null; //路径树目录
var MapTrack = {}; //路径对象
var hasChanged = false;//是否加载了滚动条

window.oncontextmenu = function() { //屏蔽默认右键菜单
	return false;
}
$.extend($.fn.datagrid.methods, {
	//将编辑后的值代入到table中
	editCell: function(jq, param) {
		return jq.each(function() {
			var opts = $(this).datagrid('options');
			var fields = $(this).datagrid('getColumnFields', true).concat($(this).datagrid('getColumnFields'));
			for(var i = 0; i < fields.length; i++) {
				var col = $(this).datagrid('getColumnOption', fields[i]);
				col.editor1 = col.editor;
				if(fields[i] != param.field) {
					col.editor = null;
				}
			}
			$(this).datagrid('beginEdit', param.index);
			var ed = $(this).datagrid('getEditor', param);
			if(ed) {
				if($(ed.target).hasClass('textbox-f')) {
					$(ed.target).textbox('textbox').focus();
				} else {
					$(ed.target).focus();
				}
			}
			for(var i = 0; i < fields.length; i++) {
				var col = $(this).datagrid('getColumnOption', fields[i]);
				col.editor = col.editor1;
			}
		});
	},
	//定义接口允许对Cell进行编辑
	enableCellEditing: function(jq) {
		return jq.each(function() {
			var dg = $(this);
			var opts = dg.datagrid('options');
			opts.oldOnClickCell = opts.onClickCell;

			opts.onClickCell = function(index, field) {
				if(opts.editIndex != undefined) {
					if(dg.datagrid('validateRow', opts.editIndex)) {
						dg.datagrid('endEdit', opts.editIndex);
						opts.editIndex = undefined;
					} else {
						return;
					}
					lastEdit = index;
				}
				dg.datagrid('selectRow', index).datagrid('editCell', {
					index: index,
					field: field
				});
				opts.editIndex = index;
				opts.oldOnClickCell.call(this, index, field);
			}
		});
	}
});

function init() { //初始化
	var lodData = {
		total: 4,
		rows: []
	};
	var StreetViewPath = earth.UserDocument.LoadXmlFile(earth.Environment.RootPath + "userdata\\StreetView.xml");
	if(StreetViewPath == "") {
		return;
	}
	var streetviewDoc = loadXMLStr(StreetViewPath);
	if(!streetviewDoc) {
		return;
	}
	//获取图像投影
	var earthType = streetviewDoc.getElementsByTagName("earthType")[0].getAttribute("name");
	if(earthType || earthType == 0) {
		$("#earthType").val(earthType);
	}
	//获取访问地址
	var url = streetviewDoc.getElementsByTagName("url")[0].getAttribute("name");
	if(url) {
		$("#url").val(url);
	}
	//获取距地高度
	var floorheight = streetviewDoc.getElementsByTagName("floorheight")[0].getAttribute("name");
	if(floorheight) {
		$("#floorheight").val(floorheight);
	}
	//获取空间坐标
	var spaceType = streetviewDoc.getElementsByTagName("spaceType")[0].getAttribute("name");
	if(spaceType || spaceType == 0) {
		$("#spaceType").val(spaceType);
	}
	//获取空间参考
	var path = streetviewDoc.getElementsByTagName("path")[0].getAttribute("name");
	if(path) {
		$("#path").val(path);
	}
	var lodlevel = streetviewDoc.getElementsByTagName("lodlevel")[0].getAttribute("name");
	if(lodlevel || lodlevel == 0) {
		$("#lodlevel").val(lodlevel);
	}
	if(lodlevel == 0) {
		$("#visaset").datagrid("loadData", lodData);
	} else {
		for(var i = 0; i <= parseInt(lodlevel); i++) {
			//获取level的值
			var slevel = streetviewDoc.getElementsByTagName("rows")[i].getElementsByTagName("level")[0].getAttribute("name");
			//获取rownum的值
			var rownum = streetviewDoc.getElementsByTagName("rows")[i].getElementsByTagName("rownum")[0].getAttribute("name");
			//获取colnum的值
			var colnum = streetviewDoc.getElementsByTagName("rows")[i].getElementsByTagName("colnum")[0].getAttribute("name");
			var row = {
				"level": i,
				"rownum": rownum,
				"colnum": colnum
			};
			lodData.rows.push(row);
		}
		$("#visaset").datagrid("loadData", lodData);
		$($(".datagrid-body")[1]).mCustomScrollbar();
		hasChanged = true;
	}
}

$(function() {
	earth = parent.earth;
	var isEnterVista = false; //是否进入街景
	var isLinkage = false; //是否街景联动
	var isTrackControl = false; //路径控制
	trackManager = STAMP.TrackManager(earth);

	$("#trackDiv").mCustomScrollbar(); //设置滚动条样式
	$("#cardBox").mCustomScrollbar(); //设置滚动条样式
	
	$("#floorheight").keyup(function() {
		$(this).val($(this).val().replace(/[^0-9.]/g, ''));
	}).bind("paste", function() { //CTR+V事件处理
		$(this).val($(this).val().replace(/[^0-9.]/g, ''));
	}).css("ime-mode", "disabled"); //CSS设置输入法不可用

	/**
	 * 删除非数字
	 * @param {Object} obj  输入字符串
	 */
	function clearNoNum(obj) {
		obj.value = obj.value.replace(/[^\d.]/g, ""); //清除“数字”和“.”以外的字符
		obj.value = obj.value.replace(/^\./g, ""); //验证第一个字符是数字而不是.
		obj.value = obj.value.replace(/\.{2,}/g, "."); //只保留第一个. 清除多余的.
		obj.value = obj.value.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
	}

	$("#floorheight").keyup(function() {
		clearNoNum(this);
	}).css("ime-mode", "disabled"); //CSS设置输入法不可用

	init(); //初始化

	/**
	 * 初始化树目录
	 */
	var initTrackTree = function() {
		var tracks = trackManager.getTracks();
		var trackTreeData = [{
			id: -1,
			name: '漫游路径',
			open: true,
			isParent: true
		}];

		// 树基本设置
		var setting = {
			data: {
				simpleData: {
					enable: true
				},
				keep: {
					parent: true
				}
			},
			view: {
				dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
				expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
				selectedMulti: false, //设置是否允许同时选中多个节点
				showTitle: true
			},
			edit: {
				enable: true,
				drag: {
					prev: true,
					inner: false,
					next: true
				},
				showRemoveBtn: false,
				showRenameBtn: false
			},
			callback: {
				onClick: clickTrackNode,
				onDblClick: dblClickTrackNode
			}
		};

		$.each(tracks, function(i, track) {
			trackTreeData.push({
				id: track["ID"],
				pId: -1,
				name: track["NAME"],
				showActor: false, // 自定义属性：是否显示人
				isParent: true
			});
			trackManager.createTrack(track["ID"], track["NAME"]);
			var curTrack = earth.TrackControl.GetTrack(track["ID"]);
			curTrack.Visibility = true;
			var stations = trackManager.getStations(curTrack);
			if(stations && stations.length > 0) {
				var v3s = earth.Factory.CreateVector3s();
				var stationObj = curTrack.GetStationByGuid(stations[0].id);
				if(stationObj.Rtti == 504) {
					for(var i = 0; i < stationObj.GetChildCount(); i++) {
						var stationChild = stationObj.GetChildAt(i);
						v3s.Add(stationChild.Longitude, stationChild.Latitude, stationChild.Altitude);
					}
				}
				MapTrack[track["ID"]] = v3s;
				$.each(stations, function(k, station) {
					trackTreeData.push(station);
				});
			}
		});
		treeTrack = $.fn.zTree.init($("#trackTree"), setting, trackTreeData)
	};

	initTrackTree(); //初始化树

	function clickTrackNode(event, treeId, node) {
		if(isTrackControl) {
			if(node.id != -1 && node.getParentNode().id == -1) {
				$("#vistaBrowse").removeAttr("disabled");
			} else {
				$("#vistaBrowse").attr("disabled", "disabled");
			}
		}
	}

	function dblClickTrackNode(event, treeId, node) {
		var track = null;
		if(node && node.id != -1) {
			if(node.isParent) {
				if(node.getParentNode().id == -1) {
					track = earth.TrackControl.GetTrack(node.id);
					trackManager.locateToTrack(track);
				} else if(node.getParentNode().getParentNode().id == -1) {
					track = earth.TrackControl.GetTrack(node.getParentNode().id);
					var station = track.GetStationByGuid(node.id);
					trackManager.locateToStation(station);
				}
			} else {
				track = earth.TrackControl.GetTrack(node.getParentNode().getParentNode().id);
				var station = track.GetStationByGuid(node.id);
				trackManager.locateToStation(station);
			}
		}
	}

	//track人称控制
	$("#divControl :radio").click(function() {
		$("#divControl :radio").removeAttr("checked");
		$(this).attr("checked", "checked");
		if($(this).val() == 2) {
			isTrackControl = true;
			var selTrackNodes = treeTrack.getSelectedNodes();
			if(selTrackNodes && selTrackNodes.length > 0 && selTrackNodes[0].id != -1 && selTrackNodes[0].getParentNode().id == -1) {
				$("#vistaBrowse").removeAttr("disabled");
			} else {
				$("#vistaBrowse").attr("disabled", "disabled");
			}
		} else {
			isTrackControl = false;
			$("#vistaBrowse").removeAttr("disabled");
		}
	});
	$("#select").click(function() {
		var path = earth.UserDocument.OpenFileDialog(earth.RootPath, "投影文件(*.spatial)|*.spatial");
		if(!path) {
			return;
		}
		$("#path").val(path);
	});
	$("#visaset").datagrid({
		fitColums: true,
		singleSelect: true
	});
	$("#visaset").datagrid().datagrid('enableCellEditing');

	$("#lodlevel").change(function() {
		if(hasChanged){
			$($(".datagrid-body")[1]).mCustomScrollbar("destroy");
		}
		var data = {
			total: 4,
			rows: []
		};
		var num = $("#lodlevel").val();
		if(num == 0) {
			$("#visaset").datagrid("loadData", data);
			hasChanged = false;
		} else {
			hasChanged = true;
			for(var i = 0; i <= parseInt(num); i++) {
				var row = {
					"level": i,
					"rownum": "",
					"colnum": ""
				};
				data.rows.push(row);
			}
			$("#visaset").datagrid("loadData", data);
			$($(".datagrid-body")[1]).mCustomScrollbar();
		}
	});

	$("#SaveVisaset").click(function() { //保存街景配置文件 导出\root\userdata\StreetView.xml文件
		$("#visaset").datagrid('endEdit', lastEdit);
		//获取图像投影
		var earthType = $("#earthType").val();
		//获取访问地址
		var url = $("#url").val();
		//获取距地高度
		var floorheight = $("#floorheight").val();
		if(isNaN(floorheight)) {
			alert("请填写距地高度");
			return;
		}
		//获取空间坐标
		var spaceType = $("#spaceType").val();
		//获取空间参考
		var path = $("#path").val();
		//获取LOD分级
		var lodlevel = $("#lodlevel").val();
		//获取分级行数列数
		var num = parseInt($("#lodlevel").val());

		var rows = new Array();
		var StreetView = "StreetView";
		var visasetXml = "<Xml><earthType name='" + earthType + "'/>";
		visasetXml += "<url name='" + url + "'/>";
		visasetXml += "<floorheight name='" + parseFloat(floorheight).toFixed(2) + "'/>";
		visasetXml += "<path name='" + path + "'/>";
		visasetXml += "<spaceType name='" + spaceType + "'/>";
		visasetXml += "<lodlevel name='" + lodlevel + "'/>";

		if(url == "") {
			alert("街景服务地址为空请填写服务地址!");
		} else {
			//当LOD不选时触发
			if(num == 0) {
				visasetXml += "</Xml>";
			} else {
				for(var i = 0; i <= num; i++) {
					var row = $("#visaset").datagrid('getData').rows[i];
					visasetXml += "<rows name='" + row.level + "'><level name='" + row.level + "'/><rownum name='" + row.rownum + "'/><colnum name='" + row.colnum + "'/></rows>";
				}
				visasetXml += "</Xml>";
			}
			var xmlDoc = parent.loadXMLStr(visasetXml); //加载xml文档
			//保存文件到userdata目录
			var root = earth.Environment.RootPath + "userdata\\" + StreetView;
			earth.UserDocument.saveXmlFile(root, xmlDoc.xml);
			if(xmlDoc.xml != "") {
				alert("设置已经完成，请选择街景浏览");
				//使街景联动和街景浏览可选按钮可选
				$('#vistaBrowse').removeAttr("disabled");
			}
		}
	});

	//街景浏览点击事件
	$("#vistaBrowse").click(function() {
		if(isEnterVista) {
			isEnterVista = false;
			$("#vistaBrowse").text("街景浏览");
			$("#vistaLinkage").attr("disabled", true);
			QuitStreetview(); //退出街景浏览
			if(isLinkage) { //如果是处于街景联动状态，则退出联动
				top.setScreen(1, "");
				top.setSync(false, true);
				isLinkage = false;
				$("#vistaLinkage").text("街景联动");
			}
		} else {
			EnterStreetView(isTrackControl); //进入街景浏览
		}
	});

	//街景联动点击事件
	$("#vistaLinkage").click(function() {
		if(isLinkage) {
			$(this).text("街景联动");
			isLinkage = false;
			top.setScreen(1, "");
			top.setSync(false, true);
		} else {
			$(this).text("退出联动");
			isLinkage = true;
			top.setScreen(2, null, false, function() {
				top.setSync(true, true);
			});
		}
	});

	//进入街景
	function EnterStreetView(isTrack) {
		//获取图像投影
		var earthType = $("#earthType").val();
		//获取访问地址
		var url = $("#url").val();
		if(url == "") {
			alert("请填入服务地址！");
			return;
		}
		//获取距地高度
		var floorheight = $("#floorheight").val();
		if(floorheight == "") {
			alert("请填入距地高度！");
			return;
		}
		//获取空间坐标
		var spaceType = $("#spaceType").val();
		//获取空间参考
		var path = $("#path").val();
		if(spaceType == "pmzb" && path == "") {
			alert("空间坐标选择的是平面坐标，必须选择空间参考文件！");
			return;
		}
		if(isTrack) {
			earth.Event.OnStreetViewTrackFinished = function(result) {

			};
			var selNode = treeTrack.getSelectedNodes()[0];
			earth.GlobeObserver.EnterStreetView(parseInt(earthType));
			earth.StreetView.ServerUrl = url;
			earth.StreetView.CenterHeight = floorheight;
			//earth.StreetView.RequestMode = 1;
			//earth.StreetView.IsUseImageAngle = false;
			if(spaceType == "pmzb") { //平面坐标需要传入空间参考
				//空间参考文件
				earth.StreetView.SpatialFile = path;
			}

			var num = parseInt($("#lodlevel").val());
			if(num > 0) {
				earth.StreetView.LevelNum = num;
				for(var i = 0; i <= num; i++) {
					var row = $("#visaset").datagrid('getData').rows[i];
					earth.StreetView.SetRowNum(row.level, row.rownum);
					earth.StreetView.SetColNum(row.level, row.colnum);
				}
			}

			//测试用-坐标为陕西街景位置的坐标----------START
			// earth.GlobeObserver.GotoLookat(106.972052, 33.030769, 579.457058, 0, 0, 0, 0);
			MapTrack[selNode.id] = earth.Factory.CreateVector3s();
			MapTrack[selNode.id].Add(106.972052, 33.030769, 579.457058);
			MapTrack[selNode.id].Add(106.970987, 33.037587, 579.316800);
			MapTrack[selNode.id].Add(106.971930, 33.030838, 579.170996);
			MapTrack[selNode.id].Add(106.971868, 33.030870, 579.034841);
			MapTrack[selNode.id].Add(106.971804, 33.030904, 579.898848);
			//测试用-坐标为陕西街景位置的坐标----------END

			earth.StreetView.EnterByPath(MapTrack[selNode.id], 50, 2);

			isEnterVista = true;
			$("#vistaBrowse").text("退出街景");
			$("#vistaLinkage").removeAttr("disabled");
			return;
		}

		//打点进入街景
		earth.Event.OnCreateGeometry = function(position) {
			if(!position) {
				return;
			}
			//注销鼠标右键事件
			earth.event.OnRBDown = function() {};
			var pose = earth.GlobeObserver.Pose;
			streetViewPose.pose = pose;
			var longitude = position.Longitude.toFixed(8);
			var latitude = position.Latitude.toFixed(8);
			var altitude = position.Altitude.toFixed(3);
			var heading = pose.Heading;
			var tilt = pose.Tilt;
			var roll = pose.Roll;
			earth.Event.OnStreetViewEntered = function(result) {
				if(!result) {
					//第一次请求失败后重新请求
					earth.StreetView.EnterByImageID("030318081506010002943");
				}
			};
			var pose = earth.GlobeObserver.Pose;
			var heading = pose.Heading;
			var tilt = pose.Tilt;
			var roll = pose.Roll;
			// var alt = earth.Measure.MeasureAltitude(longitude,latitude);
			// earth.GlobeObserver.GotoLookat(longitude, latitude, alt, heading, 0, roll, 0);
			var alt = earth.Measure.MeasureAltitude(106.972259, 33.031086); //陕西测试数据
			earth.GlobeObserver.GotoLookat(106.972259, 33.031086, alt, heading, 0, roll, 0);
			setTimeout(function() {
				earth.GlobeObserver.EnterStreetView(parseInt(earthType));
				earth.StreetView.ServerUrl = url;
				earth.StreetView.CenterHeight = floorheight;
				earth.StreetView.IsUseImageAngle = false;
				earth.StreetView.EnterByBL(106.972259, 33.031086, 0.02); //陕西测试数据
				// earth.StreetView.EnterByBL(latitude, longitude,0.02);

				if(spaceType == "pmzb") { //平面坐标需要传入空间参考
					//空间参考文件
					earth.StreetView.SpatialFile = path;
				}

				//获取LOD分级
				var lodlevel = $("#lodlevel").val();
				if(lodlevel != 0) {
					for(var i = 0; i <= num; i++) {
						var row = $("#visaset").datagrid('getData').rows[i];
						visasetXml += "<rows name='" + row.level + "'><level name='" + row.level + "'/><rownum name='" + row.rownum + "'/><colnum name='" + row.colnum + "'/></rows>";
						//获取level的值
						var slevel = row.level;
						//获取rownum的值
						var rownum = row.rownum;
						//获取colnum的值
						var colnum = row.colnum;
						//列数
						earth.StreetView.SetColNum(slevel, colnum);
						//行数
						earth.StreetView.SetRowNum(slevel, rownum);
					}
				}
			}, 2000);
			earth.ShapeCreator.Clear();
			isEnterVista = true;
			$("#vistaBrowse").text("退出街景");
			$("#vistaLinkage").removeAttr("disabled");
		};
		earth.ShapeCreator.CreatePoint();
	}

	//退出街景模式
	function QuitStreetview() {
		if(earth.GlobeObserver) {
			earth.GlobeObserver.LeaveStreetView();
			var pose = earth.GlobeObserver.Pose;
			if(streetViewPose.pose) {
				earth.GlobeObserver.FlytoLookat(pose.longitude, pose.latitude, pose.altitude, streetViewPose.pose.heading, streetViewPose.pose.tilt, streetViewPose.pose.roll, streetViewPose.pose.range, 2);
			}
		}
	}

	window.onunload = function() {
		isEnterVista = true;
		$("#vistaBrowse").trigger('click');
		trackManager.clearTracks();
	}

});