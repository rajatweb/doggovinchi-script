const Asana = require("asana");
require("dotenv").config();

let client = Asana.ApiClient.instance;
let token = client.authentications["token"];
token.accessToken = process.env.ASANA_ACCESS_TOKEN;

let tasksApiInstance = new Asana.TasksApi();
let workspacesApiInstance = new Asana.WorkspacesApi();
let projectsApiInstance = new Asana.ProjectsApi();

/**
 * Get Workspace
 */
const getWorkspaces = async () => {
  let opts = {
    limit: 5,
    opt_fields: "email_domains,is_organization,name,offset,path,uri",
  };
  const response = await workspacesApiInstance.getWorkspaces(opts).then(
    (result) => {
      return result.data.filter(
        (d) => d.name === process.env.ASANA_WORKSPACE_NAME
      )[0].gid;
    },
    (error) => {
      console.error(error.response.body);
    }
  );

  return response;
};

const getActiveProjects = async (wgid) => {
  let opts = {
    limit: 5,
    workspace: wgid,
    archived: false,
    opt_fields:
      "archived,color,completed,completed_at,completed_by,completed_by.name,created_at,created_from_template,created_from_template.name,current_status,current_status.author,current_status.author.name,current_status.color,current_status.created_at,current_status.created_by,current_status.created_by.name,current_status.html_text,current_status.modified_at,current_status.text,current_status.title,current_status_update,current_status_update.resource_subtype,current_status_update.title,custom_field_settings,custom_field_settings.custom_field,custom_field_settings.custom_field.asana_created_field,custom_field_settings.custom_field.created_by,custom_field_settings.custom_field.created_by.name,custom_field_settings.custom_field.currency_code,custom_field_settings.custom_field.custom_label,custom_field_settings.custom_field.custom_label_position,custom_field_settings.custom_field.date_value,custom_field_settings.custom_field.date_value.date,custom_field_settings.custom_field.date_value.date_time,custom_field_settings.custom_field.description,custom_field_settings.custom_field.display_value,custom_field_settings.custom_field.enabled,custom_field_settings.custom_field.enum_options,custom_field_settings.custom_field.enum_options.color,custom_field_settings.custom_field.enum_options.enabled,custom_field_settings.custom_field.enum_options.name,custom_field_settings.custom_field.enum_value,custom_field_settings.custom_field.enum_value.color,custom_field_settings.custom_field.enum_value.enabled,custom_field_settings.custom_field.enum_value.name,custom_field_settings.custom_field.format,custom_field_settings.custom_field.has_notifications_enabled,custom_field_settings.custom_field.id_prefix,custom_field_settings.custom_field.is_formula_field,custom_field_settings.custom_field.is_global_to_workspace,custom_field_settings.custom_field.is_value_read_only,custom_field_settings.custom_field.multi_enum_values,custom_field_settings.custom_field.multi_enum_values.color,custom_field_settings.custom_field.multi_enum_values.enabled,custom_field_settings.custom_field.multi_enum_values.name,custom_field_settings.custom_field.name,custom_field_settings.custom_field.number_value,custom_field_settings.custom_field.people_value,custom_field_settings.custom_field.people_value.name,custom_field_settings.custom_field.precision,custom_field_settings.custom_field.representation_type,custom_field_settings.custom_field.resource_subtype,custom_field_settings.custom_field.text_value,custom_field_settings.custom_field.type,custom_field_settings.is_important,custom_field_settings.parent,custom_field_settings.parent.name,custom_field_settings.project,custom_field_settings.project.name,custom_fields,custom_fields.date_value,custom_fields.date_value.date,custom_fields.date_value.date_time,custom_fields.display_value,custom_fields.enabled,custom_fields.enum_options,custom_fields.enum_options.color,custom_fields.enum_options.enabled,custom_fields.enum_options.name,custom_fields.enum_value,custom_fields.enum_value.color,custom_fields.enum_value.enabled,custom_fields.enum_value.name,custom_fields.id_prefix,custom_fields.is_formula_field,custom_fields.multi_enum_values,custom_fields.multi_enum_values.color,custom_fields.multi_enum_values.enabled,custom_fields.multi_enum_values.name,custom_fields.name,custom_fields.number_value,custom_fields.representation_type,custom_fields.resource_subtype,custom_fields.text_value,custom_fields.type,default_access_level,default_view,due_date,due_on,followers,followers.name,html_notes,icon,members,members.name,minimum_access_level_for_customization,minimum_access_level_for_sharing,modified_at,name,notes,offset,owner,path,permalink_url,privacy_setting,project_brief,public,start_on,team,team.name,uri,workspace,workspace.name",
  };
  const response = projectsApiInstance.getProjects(opts).then(
    (result) => {
      return result.data[0].gid;
    },
    (error) => {
      console.error(error.response.body);
    }
  );

  return response;
};

const setName = (number, length) => {
  if (length < 1) {
    return `${number}`;
  }
  return `${number} - ${length} ${length === 1 ? "Order" : "Orders"}`;
};

const setNotes = async (order_number, filtered_products, note, customer) => {
  let body = "<body>";
  body += `<ul>
          <li><b>Customer Detail:</b></li>
          <li>Order No: #${order_number}</li>
          <li>Name: <a href="https://admin.shopify.com/store/doggovinci/customers/${customer.id}" target="__blank">${customer.first_name} ${customer.last_name}</a></li>
          <li>Email: <a href="mailto:${customer.email}">${customer.email}</a></li>
          <li>Client Note: ${note ? note : 'No notes from customer'}</li>
    </ul>`;
  body += filtered_products.map(
    (product) => `
        <strong><a href="https://admin.shopify.com/store/doggovinci/products/${product.product_id}/variants/${product.variant_id}" target="__blank">${product.title}</a></strong>
        <ul>
          <li>SKU: ${product.sku ? product.sku : 'NA'}</li>
          ${
            product.infinite_options.length > 0 &&
            product.infinite_options.map(
              (io) => `<li>Infinite Options: ${io.value}</li>`
            )
          }
        </ul>
    `
  );
  body += "</body>";
  return body;
};

const createTask = async (order, note) => {
  const wgid = await getWorkspaces();
  const pgid = await getActiveProjects(wgid);

  if (!pgid) {
    return;
  }

  const { order_number, filtered_products, customer } = order;

  let body = {
    data: {
      name: setName(order_number, filtered_products.length),
      approval_status: "pending",
      assignee_status: "upcoming",
      completed: false,
      html_notes: await setNotes(order_number, filtered_products, note, customer),
      is_rendered_as_separator: false,
      liked: false,
      assignee: "me",
      projects: [pgid],
    },
  };
  let opts = {};

  // POST - Create a task
  const response = await tasksApiInstance.createTask(body, opts);

  filtered_products.map(async (product) => {
    product.images.map(async (img) => {
      const imgBlob = await fetch(img.preview_url).then((res) => res.blob());

      const options = {};
      const formData = new FormData();
      formData.append("file", imgBlob, `${Date.now()}.jpg`);
      formData.append("parent", response.data.gid);
      options.body = formData;
      options.method = "POST";
      options.headers = {
        Authorization: `Bearer ${token.accessToken}`,
      };

      await fetch("https://app.asana.com/api/1.0/attachments", options)
        .then((res) => res.json())
        .catch((err) => console.error(err.message));
    });
  });

  return response;
};

module.exports = {
  createTask,
};
