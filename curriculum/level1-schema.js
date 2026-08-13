(function(root){
  function validateTheme(theme){
    const errors=[];
    if(!theme||typeof theme!=='object')return ['Theme must be an object'];
    if(typeof theme.id!=='string'||!theme.id)errors.push('Theme id is required');
    if(typeof theme.title!=='string'||!theme.title)errors.push('Theme title is required');
    return errors;
  }

  root.MalbitLevel1Schema={validateTheme};
})(globalThis);
