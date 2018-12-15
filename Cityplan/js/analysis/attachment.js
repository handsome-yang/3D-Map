/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：项目附件(类)
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/

if (!STAMP) {
    var STAMP = {};
}

STAMP.Attachment = function (earth) {
    var attachment = {};
    var buildIDs = [];
    var nodes = {id:1, pId:0, name:"附件",open:true,isParent:true};

    //生成树设置
    var initPlanTree  = function (treeData,treeObj){
        var setting={
            check:{
                enable:false//是否显示checkbox或radio
            }, 
            data: {
                simpleData: {
                    enable: false
                },
                keep:{
                    parent:true
                }
            },
            view:{
                dblClickExpand:false, //双击节点时，是否自动展开父节点的标识
                expandSpeed:"", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
                selectedMulti:false //设置是否允许同时选中多个节点
            },
            callback:{
                onDblClick:clickNode
            }
        };
        var planTree = $.fn.zTree.init(treeObj, setting, treeData);
        planTree.expandAll(true);
    };
    // 双击节点
    function clickNode(event, treeId, treeNode) {
        var url;
        var bSync = false;
        var type;
        if(treeNode){
            type = treeNode.attachmentType;    
        }
        if(type){
            type = type.toLowerCase();
        }else{
            return;
        }
        if(treeNode && !treeNode.isParent ){
            //新增type后缀。。。2014.4.16
            url = top.STAMP_config.service.getAttachmentObj + treeNode.id + "&blobtype=" + type;
            var returnStatus = earth.UserDocument.SaveFile(url, treeNode.id + "." + type);
            if(returnStatus){
                var filePath = earth.RootPath + "\\temp\\" + treeNode.id + "." + type;
                exec('file:///C:/av/avwin/avwin.exe', filePath);
            }
        }
    };

    function exec(command, url) {
        window.oldOnError = window.onerror;
        window._command = command;
        window.onerror = function (err) {
            if (err.indexOf('utomation') != -1){
                alert('请更改你的IE的安全级别：开始->设置->控制面板->Internet选项->安全->自定义级别->对没有标记为安全的ActiveX控件进行初始化和脚本运行->启用。命令：'+ window._command);
                return true;
            }
            else
                return false;
        };
        var wsh = new ActiveXObject('WScript.Shell');
        if (wsh) wsh.Run(command  + " " + url);
        wsh = null;
        window.onerror = window.oldOnError;
    };

    //通过planid查找附件
    var planLoop = 0;
    var searchAttachment2 = function(planIds,len,nodes,treeObj){
        var planId;
        if(planIds && planIds.length && planLoop < len){
            planId = planIds[planLoop];
            //方案附件与项目附件
            var xml ='<QUERY>' +
            '<CONDITION><AND>' +
            '<PLANID  tablename="CPATTACHMENT">=\''+planId.id+'\'</PLANID>' +
            '</AND></CONDITION>' +
            '<RESULT><CPATTACHMENT><FIELD>ID</FIELD><FIELD>PLANID</FIELD> '+
            '<FIELD>NAME</FIELD><FIELD>TYPE</FIELD></CPATTACHMENT></RESULT>' +
            '</QUERY>';
            
            $.post(top.STAMP_config.service.query, xml, function(data){
                var record = $.xml2json(data).record;
                var isTotal = false;
                if(record){
                    var attachNodes=[];
                    if(record.length){
                        for(var p=0;p<record.length;p++){
                            var recordItem = record[p];
                            if(recordItem["CPATTACHMENT.NAME"] === planId.id && recordItem["CPATTACHMENT.PLANID"] === planId.id){
                                
                            }else{
                                // 增加类型节点
                                addFileNode(attachNodes, recordItem);
                            }
                        }
                    }else{
                        if(record["CPATTACHMENT.NAME"] === planId.id && record["CPATTACHMENT.PLANID"] === planId.id){
                            
                        }else{
                            // 增加类型节点
                            addFileNode(attachNodes, record);
                        }
                    }
                    planId.children = attachNodes;
                }else{
                    //如果没有数据 则删除该节点
                    var nodeAry = nodes.children;
                }
                planLoop++;
                if(planLoop == len){
                    planLoop = 0;
                    initPlanTree(nodes,treeObj);
                    return;
                }
                searchAttachment2(planIds, len, nodes,treeObj);
            }, "text");
        }        
    };

    var tm = [{
        type: 'dwg',
        name: 'DWG',
        types: ['dxf', 'dwg']
    }, {
        type: 'doc',
        name: 'DOC',
        types: ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt']
    }, {
        type: 'picture',
        name: 'Picture',
        types: ['bmp', 'jpg', 'gif', 'png', 'tiff']
    }];

    var getType = function(fileExName){
        var fn = fileExName;
        if(!fn){
            return null;
        }
        
        for(var i in tm){
            if($.inArray(fn.toLowerCase(), tm[i].types) >= 0){
                return tm[i];
            }
        }
        return null;
    };

    var getNodeById = function(id, nodes){
        if(!nodes || !id){
            return null;
        }
        for(var i = 0;i < nodes.length;i++){
            if(id == nodes[i].id){
                return nodes[i];
            }
        }
        return null;
    };

    var addFileNode = function(nodes, record,name){
        if(!nodes || !record){
            return;
        }

        var pid = record['CPATTACHMENT.PLANID'];
        var t = record['CPATTACHMENT.TYPE'].toLowerCase();
        var tn = getType(t);
        if(tn == null){
            tm.push({
                type: record["CPATTACHMENT.TYPE"],
                name: record["CPATTACHMENT.TYPE"].toUpperCase(),
                types: [record["CPATTACHMENT.TYPE"]]
            });
            nodes.push({
                id: record["CPATTACHMENT.TYPE"].toUpperCase(),
                name: record["CPATTACHMENT.TYPE"].toUpperCase(),
                pId: pid,
                attachmentType: record["CPATTACHMENT.TYPE"],
                icon: "../../images/treeIcons/folder.png",
                children: [{
                    id: record['CPATTACHMENT.ID'],
                    name: record["CPATTACHMENT.NAME"],
                    pId: pid,
                    icon: "../../images/treeIcons/附件.png",
                    attachmentType: record["CPATTACHMENT.TYPE"]
                }]
            });
            return;
        }
        var tid = pid + '_' + tn.type;
        var tnode = getNodeById(tid, nodes);
        if(tnode == null){
            var tempName = tn.name;
            if(name!=null){
                tempName = name;
            }
            tnode = {
                id: tid,
                name: tempName,
                pId: pid,
                open: true,
                isParent: true,
                icon: "../../images/treeIcons/folder.png",
                children: []
            };
            nodes.push(tnode);
        }
        tnode.children.push({
            id: record['CPATTACHMENT.ID'],
            name: record["CPATTACHMENT.NAME"],
            pId: tid,
            icon: "../../images/treeIcons/附件.png",
            attachmentType: record["CPATTACHMENT.TYPE"]
        });
    };

    /**
     * 查询建筑附件并构造附件树
     * new:分类列出各建筑的附件
     * add by zc 2014-08-04 16:41:28
     **/
    var searchBuildAttachments2 = function(node, nodes, buildGuid ,treeObj){
        $.ajaxSetup({
            async : false  // 将ajax请求设为同步
        });
        var buildingAchs = {};
        if(buildGuid && buildGuid.length == 1){
            var attachNodes=[];
            //获取方案中的建筑 
            var xml = '<QUERY><CONDITION>';
            xml += '<OR>' +
                '<PLANID  tablename="CPBUILDING">=\''+buildGuid[0]+'\'</PLANID>' +
                '</OR>';
            xml += '</CONDITION>' +
                    '<RESULT><CPBUILDING><FIELD>ID</FIELD><FIELD>PLANID</FIELD> '+
                    '<FIELD>NAME</FIELD></CPBUILDING></RESULT>' +
                    '</QUERY>';

            $.post(top.STAMP_config.service.query, xml, function(data){
                var record = $.xml2json(data).record;
                if(record){
                    if(record.length){
                        for(var p=0;p<record.length;p++){
                            var recordItem = record[p];
                            var buildingName = recordItem["CPBUILDING.NAME"];
                            var buildingID = recordItem["CPBUILDING.ID"];
                            buildingAchs[buildingID] = buildingName;
                        }
                    }else{
                        var buildingName = record["CPBUILDING.NAME"];
                        var buildingID = record["CPBUILDING.ID"];
                        buildingAchs[buildingID] = buildingName;
                    }
                }
            }, "text");
            
            //获取建筑物的附件 
            var xml = '<QUERY><CONDITION>';
            for(var guid in buildingAchs){
                xml += '<OR>' +
                    '<PLANID  tablename="CPATTACHMENT">=\''+guid+'\'</PLANID>' +
                    '</OR>';
            }
            xml += '</CONDITION>' +
                    '<RESULT><CPATTACHMENT><FIELD>ID</FIELD><FIELD>PLANID</FIELD> '+
                    '<FIELD>NAME</FIELD><FIELD>TYPE</FIELD></CPATTACHMENT></RESULT>' +
                    '</QUERY>';
            $.post(top.STAMP_config.service.query, xml, function(data){
                var record = $.xml2json(data).record;
                if(record){
                    if(record.length){
                        for(var p=0;p<record.length;p++){
                            var recordItem = record[p];
                            if(recordItem["CPATTACHMENT.NAME"] === buildGuid[p] && recordItem["CPATTACHMENT.PLANID"] === buildGuid[p]){
                            
                            }else{
                               var name = buildingAchs[recordItem["CPATTACHMENT.PLANID"]];
                               addFileNode(attachNodes,recordItem,name);
                            }
                        }
                    }else{
                        if(record["CPATTACHMENT.NAME"] === buildGuid[p] && record["CPATTACHMENT.PLANID"] === buildGuid[p]){
                        
                        }else{
                            addFileNode(attachNodes,record);
                        }
                    }
                }
            }, "text");
        }
        node.children = attachNodes;
        initPlanTree(nodes, treeObj);
    }

    attachment.searchAttachment2 =searchAttachment2 ;
    attachment.searchBuildAttachments2 = searchBuildAttachments2;
    return  attachment;
} ;