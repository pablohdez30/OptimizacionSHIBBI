-- Datos placeholder para arrancar.
-- Precios estimados del sector mueble artesano España 2026 — ajustar
-- con precios reales editando filas desde Supabase Dashboard.

-- ============================================================
-- materiales
-- ============================================================
insert into materiales (nombre, tipo, precio_m2, grosor_opciones, descripcion, aplicable_a, orden, activo) values
('Roble macizo',           'madera',  180, '3,5,8',           'Madera dura noble con vetas marcadas. Tono miel/dorado. La opción premium para mesas que duran generaciones.', array['mesa','estanteria'], 1, true),
('Pino macizo',            'madera',   95, '3,5',             'Madera clara y económica. Veta visible y carácter rústico. Perfecta para estilos nórdicos y mediterráneos.',   array['mesa','estanteria'], 2, true),
('Nogal macizo',           'madera',  280, '3,5,8',           'Madera oscura premium con veta elegante. Tono marrón profundo. Para piezas de alta gama.',                    array['mesa','estanteria'], 3, true),
('Haya macizo',            'madera',  140, '3,5',             'Madera clara y muy resistente. Acabado fino y limpio. Ideal para mesas de trabajo o cocina.',                array['mesa','estanteria'], 4, true),
('Contrachapado abedul',   'tablero',  90, '15mm,18mm,30mm',  'Tablero estable de capas con acabado claro. Resistente a humedad y deformación.',                            array['mesa','estanteria'], 5, true),
('MDF chapado roble',      'tablero',  75, '16mm,19mm,22mm',  'Tablero económico con chapa de roble natural. Acabado parecido al roble macizo a menor coste.',              array['mesa','estanteria'], 6, true);

-- ============================================================
-- componentes
-- ============================================================
insert into componentes (nombre, categoria, precio_unidad, unidad_default, unidad_opciones, descripcion, aplicable_a, orden, activo) values
('Pata Hairpin (horquilla)',  'pata',     30, 4, '3,4',         'Patas de varilla metálica curvada. Estilo nórdico minimalista.',                                array['mesa'], 1, true),
('Pata U metálica',            'pata',     45, 2, '2',           'Soporte tipo U en pletina de hierro. Aspecto industrial robusto.',                              array['mesa'], 2, true),
('Pata X / aspa',              'pata',     55, 2, '2',           'Patas en aspa de hierro pintado. Estilo industrial elegante.',                                  array['mesa'], 3, true),
('Pata A / trapecio',          'pata',     65, 2, '2',           'Patas trapezoidales modernas en hierro o madera. Carácter contemporáneo.',                      array['mesa'], 4, true),
('Pata madera torneada',       'pata',     40, 4, '4',           'Pata clásica torneada en madera. Estilo tradicional o vintage.',                                array['mesa'], 5, true),
('Pata diseño a medida',       'pata',     90, 4, '2,3,4,6',     'Pata diseñada exclusivamente según tu idea. Desde 90 €/ud según complejidad.',                  array['mesa'], 6, true),
('Pedestal central',           'pata',    150, 1, '1',           'Base central robusta. Ideal para mesas redondas o cuadradas pequeñas.',                          array['mesa'], 7, true),
('Soporte L estantería',       'soporte',  12, 4, '2,4,6,8',     'Escuadra metálica simple. Estilo industrial visible.',                                          array['estanteria'], 8, true),
('Soporte oculto',             'soporte',  28, 4, '2,4,6,8',     'Soporte invisible para baldas flotantes.',                                                       array['estanteria'], 9, true);

-- ============================================================
-- extras (acabados + servicios)
-- ============================================================
insert into extras (nombre, categoria, precio, modificador, descripcion, aplicable_a, orden, activo) values
('Sin acabado (madera natural)',    'acabado',   0, 'fijo',       'Madera sin tratar. Tú aplicas lo que prefieras o lo dejas natural.',                            array['mesa','estanteria','espejo'], 1, true),
('Aceite natural',                  'acabado',  35, 'fijo',       'Aceite que protege la madera y resalta la veta. Acabado mate natural.',                          array['mesa','estanteria'],          2, true),
('Barniz mate',                     'acabado',  50, 'fijo',       'Barniz protector mate. Resistente a manchas y humedad.',                                         array['mesa','estanteria'],          3, true),
('Tinte color a elegir',            'acabado',  70, 'fijo',       'Tinte personalizado en el tono que prefieras. Mantiene la veta visible.',                        array['mesa','estanteria'],          4, true),
('Lacado color opaco',              'acabado',  90, 'fijo',       'Lacado en color a elegir. Acabado opaco que tapa la veta.',                                      array['mesa','estanteria'],          5, true),
('Montaje a domicilio Madrid',      'servicio', 50, 'fijo',       'Montaje en domicilio dentro de Madrid capital. Fuera de Madrid lo calculamos según destino.',    array['mesa','estanteria','espejo','otro'], 6, true),
('Embalaje regalo',                 'servicio', 15, 'fijo',       'Caja de regalo personalizada con tarjeta dedicada.',                                              array['mesa','estanteria','espejo','otro'], 7, true),
('Urgencia (entrega <2 semanas)',   'servicio', 20, 'porcentaje', 'Recargo del 20 % sobre el total para entregas urgentes.',                                         array['mesa','estanteria','espejo','otro'], 8, true);
