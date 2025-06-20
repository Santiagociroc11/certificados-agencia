export const loadFont = (fontFamily: string) => {
  const fontId = `font-link-${fontFamily.replace(/\s+/g, '-')}`;

  if (document.getElementById(fontId)) {
    return; // Font is already loaded or is being loaded.
  }

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css?family=${fontFamily.replace(/\s+/g, '+')}:400,700`;
  
  document.head.appendChild(link);
}; 