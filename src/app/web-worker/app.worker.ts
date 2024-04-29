const ctx: Worker = self as any;

ctx.addEventListener('message', function(e) {
  let data = e.data;
  switch (data.type) {
    case 'search':
      let overallCategoryArray = [];
      data.list.forEach(menuObject => {
        // Sections
        if(menuObject.sections && menuObject.sections.length) {
          let sectionList = menuObject.sections.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
          sectionList.forEach(secObject => {
            // Categories
            if(secObject.categories && secObject.categories.length)
            {
              let categoryList = secObject.categories.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
              categoryList.forEach(catObject => {
                // Sub Categories
                if(catObject.sub_categories && catObject.sub_categories.length) {
                  let subCategoryList = catObject.sub_categories.sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
                  subCategoryList.forEach(subCatObject => {
                    // overall category list
                    let subCatName = menuObject.name + " > " + secObject.name + " > " + catObject.name + " > " + subCatObject.name;
                    if(subCatObject.link_status && subCatObject.link_type=='category') overallCategoryArray.push({ _id: subCatObject.category_id, type: "sub-category", name: subCatName });
                  });
                }
                else {
                 // overall category list
                  let catName = menuObject.name+" > "+secObject.name+" > "+catObject.name;
                  if(catObject.link_status && catObject.link_type=='category') overallCategoryArray.push({  _id: catObject.category_id, type: "category", name: catName });
                }
              });
            }
            else {
              // overall category list
              let secName = menuObject.name + " > " + secObject.name;
              if(secObject.link_status && secObject.link_type=='category') overallCategoryArray.push({  _id: secObject.category_id, type: "section", name: secName });
            }
          });
        }
        else {
          // overall category list
          if(menuObject.link_status && menuObject.link_type=='category') overallCategoryArray.push({ _id: menuObject.category_id, type: "menu", name: menuObject.name });
        }
      });
      ctx.postMessage(JSON.stringify(overallCategoryArray));
      break;
    default:
      ctx.postMessage(data);
  };
}, false);