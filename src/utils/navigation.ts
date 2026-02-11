// apps/web/src/utils/navigation.ts

const API_URL = import.meta.env.PUBLIC_API_URL;

/**
 * Construye la URL completa de un servicio basándose en su jerarquía
 * INCLUYE el slug del main service en la ruta de sus hijos
 */
async function buildServicePath(service: any): Promise<string> {
  try {
    // Validar que service existe
    if (!service) {
      console.error("buildServicePath: service is null or undefined");
      return "/";
    }

    // Validar que service tiene slug
    if (!service.slug) {
      console.error("buildServicePath: service has no slug", service);
      return "/";
    }

    // Si es servicio principal, solo retorna el slug
    if (service.isMainService) {
      return `/${service.slug}`;
    }

    // Si no tiene padre, retornar solo el slug
    if (!service.parentService) {
      return `/${service.slug}`;
    }

    // Obtener el padre (usar objeto cargado o hacer fetch)
    let parent;
    if (
      typeof service.parentService === "object" &&
      service.parentService.slug
    ) {
      parent = service.parentService;
    } else {
      const parentId =
        typeof service.parentService === "object"
          ? service.parentService.id
          : service.parentService;

      const parentRes = await fetch(
        `${API_URL}/api/services/${parentId}?depth=1`,
      );

      if (!parentRes.ok) {
        console.error(`Failed to fetch parent service: ${parentId}`);
        return `/${service.slug}`;
      }

      parent = await parentRes.json();
    }

    // Validar que parent existe
    if (!parent) {
      console.error("Parent service is null");
      return `/${service.slug}`;
    }

    // Validar que parent tiene slug
    if (!parent.slug) {
      console.error("Parent has no slug", parent);
      return `/${service.slug}`;
    }

    // ✅ Si el padre es servicio principal
    if (parent.isMainService) {
      // ✅ CASO ESPECIAL: Si padre e hijo tienen el mismo slug
      // Ejemplo: Plumbing (plumbing-services) → General Plumbing (plumbing-services)
      if (parent.slug === service.slug) {
        return `/${service.slug}`;
      }

      // ✅ CASO NORMAL: Padre e hijo tienen slugs diferentes
      // Ejemplo: Drains (drain-services) → Drain Clearing (drain-clearing)
      return `/${parent.slug}/${service.slug}`;
    }

    // ✅ Si el padre NO es servicio principal, construir recursivamente
    const parentPath = await buildServicePath(parent);

    // ✅ Evitar duplicación si el hijo tiene el mismo slug que está al final del parentPath
    const parentSlugAtEnd = parentPath.split("/").pop();
    if (parentSlugAtEnd === service.slug) {
      return parentPath;
    }

    const fullPath = `${parentPath}/${service.slug}`;
    return fullPath;
  } catch (error) {
    console.error("Error building service path:", error);
    return `/${service?.slug || "unknown"}`;
  }
}
/**
 * Normaliza una URL para que siempre sea absoluta
 */
function normalizeUrl(url: string): string {
  if (!url) return "#";
  if (url.startsWith("/") || url.startsWith("http")) {
    return url;
  }
  return `/${url}`;
}

export async function buildNavigationMenu(menuItems: any[]) {
  return await Promise.all(
    menuItems.map(async (item: any) => {
      if (item.useServicesMenu && item.serviceCategory) {
        const mainServiceId =
          typeof item.serviceCategory === "object"
            ? item.serviceCategory.id
            : item.serviceCategory;

        try {
          const mainServiceRes = await fetch(
            `${API_URL}/api/services/${mainServiceId}?depth=2`,
          );

          if (!mainServiceRes.ok) {
            return {
              label: item.label,
              url: normalizeUrl(item.url) || "#",
              order: item.order,
              icon: item.icon,
              subItems: [],
            };
          }

          const mainService = await mainServiceRes.json();

          if (!mainService || !mainService.slug) {
            return {
              label: item.label,
              url: normalizeUrl(item.url) || "#",
              order: item.order,
              icon: item.icon,
              subItems: [],
            };
          }

          // Obtener todos los hijos directos del main service
          const directChildrenRes = await fetch(
            `${API_URL}/api/services?where[parentService][equals]=${mainServiceId}&where[active][equals]=true&sort=order&limit=100&depth=2`,
          );

          if (!directChildrenRes.ok) {
            return {
              label: item.label,
              url: `/${mainService.slug}`,
              order: item.order,
              icon: item.icon,
              subItems: [],
            };
          }

          const directChildren = await directChildrenRes.json();

          if (!directChildren || !directChildren.docs) {
            return {
              label: item.label,
              url: `/${mainService.slug}`,
              order: item.order,
              icon: item.icon,
              subItems: [],
            };
          }

          // Procesar cada hijo directo
          const subItems = await Promise.all(
            directChildren.docs.map(async (child: any) => {
              if (!child || !child.slug) {
                return null;
              }

              try {
                const childUrl = await buildServicePath(child);

                // Buscar si este hijo tiene sus propios hijos (sub-servicios)
                const grandChildrenRes = await fetch(
                  `${API_URL}/api/services?where[parentService][equals]=${child.id}&where[active][equals]=true&sort=order&limit=${item.showAllSubServices ? 100 : item.maxSubServices || 5}&depth=2`,
                );

                let grandChildren = [];

                if (grandChildrenRes.ok) {
                  const grandChildrenData = await grandChildrenRes.json();

                  if (
                    grandChildrenData?.docs &&
                    grandChildrenData.docs.length > 0
                  ) {
                    grandChildren = await Promise.all(
                      grandChildrenData.docs.map(async (grandChild: any) => {
                        if (!grandChild || !grandChild.slug) return null;

                        const grandChildUrl =
                          await buildServicePath(grandChild);

                        return {
                          label: grandChild.title,
                          url: grandChildUrl,
                          icon: grandChild.icon,
                        };
                      }),
                    );

                    grandChildren = grandChildren.filter((gc) => gc !== null);
                  }
                }

                // Si tiene nietos, mostrar con submenu anidado
                if (grandChildren.length > 0) {
                  return {
                    label: child.title,
                    url: child.hasPage
                      ? childUrl
                      : grandChildren[0]?.url || "#",
                    icon: child.icon,
                    children: grandChildren,
                  };
                }

                // Si NO tiene nietos pero tiene página, es un link directo
                if (child.hasPage) {
                  return {
                    label: child.title,
                    url: childUrl,
                    icon: child.icon,
                    children: [],
                  };
                }

                // Si no tiene página ni hijos, omitir
                return null;
              } catch (error) {
                console.error(`Error processing child ${child.id}:`, error);
                return null;
              }
            }),
          );

          const filteredSubItems = subItems.filter((item) => item !== null);

          return {
            label: item.label,
            url: normalizeUrl(item.url) || `/${mainService.slug}`,
            order: item.order,
            icon: item.icon,
            subItems: filteredSubItems,
          };
        } catch (error) {
          console.error("Error building services menu:", error);
          return {
            label: item.label,
            url: normalizeUrl(item.url) || "#",
            order: item.order,
            icon: item.icon,
            subItems: [],
          };
        }
      }

      // Menú manual
      const subItems = item.subItems?.map((subItem: any) => ({
        ...subItem,
        url: normalizeUrl(subItem.url),
        children: subItem.children?.map((child: any) => ({
          ...child,
          url: normalizeUrl(child.url),
        })),
      }));

      return {
        label: item.label,
        url: normalizeUrl(item.url),
        order: item.order,
        icon: item.icon,
        subItems: subItems || [],
      };
    }),
  );
}
