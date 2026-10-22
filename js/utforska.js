/* Utforska – hela Link Up uppdelat i Prata, Träffas och Om Link Up (samma struktur som menyn) */

function initPage() {
  $('#explore').innerHTML = SECTIONS.map(s =>
    '<section id="' + s.id + '" aria-labelledby="' + s.id + '-title" style="margin-top:2.5rem">' +
      '<h2 id="' + s.id + '-title">' + s.title + '</h2>' +
      '<div class="grid grid-3">' + s.items.map(i =>
        '<a class="card card-link big-card" href="' + i.href + '">' +
          '<span class="icon-wrap">' + icon(i.icon) + '</span>' +
          '<h3>' + i.label + '</h3><p class="muted">' + i.desc + '</p>' +
          '<span class="go">Gå till ' + i.label + ' ' + icon('arrow') + '</span>' +
        '</a>').join('') +
      '</div>' +
    '</section>').join('');
}
