import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	District,
	School,
	LoginPayload,
	AdminStats,
	AdminDistrict,
	AdminSchool,
	AdminSchoolsResponse,
	AdminSchoolsParams,
	SchoolInput,
} from "@/types";

function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === "") continue;
		out[key] = value;
	}
	return out;
}

export const schoolsApi = createApi({
	reducerPath: "schoolsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API || ""}/api`,
		credentials: "include",
	}),
	tagTypes: [
		"Districts",
		"Schools",
		"Data",
		"AdminSchools",
		"AdminStats",
		"AdminDistricts",
	],
	endpoints: (builder) => ({
		getDistricts: builder.query<District[], void>({
			query: () => "/districts",
			providesTags: ["Districts"],
		}),

		getSchoolsByDistrict: builder.query<School[], number>({
			query: (districtId) => `/districts/${districtId}/schools`,
			providesTags: (_res, _err, id) => [{ type: "Schools", id }],
		}),

		getDataVersion: builder.query<{ version: number }, void>({
			query: () => "/data/version",
		}),

		getDataAll: builder.query<
			{ version: number; districts: District[]; schools: School[] },
			void
		>({
			query: () => "/data/all",
			providesTags: ["Districts", "Schools"],
		}),

		login: builder.mutation<{ status: string }, LoginPayload>({
			query: (body) => ({ url: "/admin/login", method: "POST", body }),
		}),

		logout: builder.mutation<{ status: string }, void>({
			query: () => ({ url: "/admin/logout", method: "POST" }),
		}),

		checkDataExists: builder.query<{ exists: boolean }, void>({
			query: () => "/admin/data/exists",
			providesTags: ["Data"],
		}),

		uploadData: builder.mutation<
			{ status: string; districts: number; schools: number },
			FormData
		>({
			query: (formData) => ({
				url: "/admin/data/upload",
				method: "POST",
				body: formData,
			}),
			invalidatesTags: [
				"Districts",
				"Schools",
				"Data",
				"AdminSchools",
				"AdminStats",
				"AdminDistricts",
			],
		}),


		getAdminStats: builder.query<AdminStats, void>({
			query: () => "/admin/stats",
			providesTags: ["AdminStats"],
		}),

		getAdminDistricts: builder.query<AdminDistrict[], void>({
			query: () => "/admin/districts",
			providesTags: ["AdminDistricts"],
		}),

		getAdminSchools: builder.query<AdminSchoolsResponse, AdminSchoolsParams>({
			query: (params) => ({
				url: "/admin/schools",
				params: cleanParams({ ...params }),
			}),
			providesTags: (res) =>
				res
					? [
							...res.items.map((s) => ({
								type: "AdminSchools" as const,
								id: s.id,
							})),
							{ type: "AdminSchools" as const, id: "LIST" },
						]
					: [{ type: "AdminSchools" as const, id: "LIST" }],
		}),

		getAdminSchool: builder.query<AdminSchool, number>({
			query: (id) => `/admin/schools/${id}`,
			providesTags: (_res, _err, id) => [{ type: "AdminSchools", id }],
		}),

		createSchool: builder.mutation<AdminSchool, SchoolInput>({
			query: (body) => ({ url: "/admin/schools", method: "POST", body }),
			invalidatesTags: [
				{ type: "AdminSchools", id: "LIST" },
				"AdminStats",
				"AdminDistricts",
				"Districts",
				"Schools",
			],
		}),

		updateSchool: builder.mutation<
			AdminSchool,
			{ id: number; body: SchoolInput }
		>({
			query: ({ id, body }) => ({
				url: `/admin/schools/${id}`,
				method: "PATCH",
				body,
			}),
			invalidatesTags: (_res, _err, { id }) => [
				{ type: "AdminSchools", id },
				{ type: "AdminSchools", id: "LIST" },
				"AdminStats",
				"AdminDistricts",
				"Districts",
				"Schools",
			],
		}),

		deleteSchool: builder.mutation<{ status: string; id: number }, number>({
			query: (id) => ({ url: `/admin/schools/${id}`, method: "DELETE" }),
			invalidatesTags: [
				{ type: "AdminSchools", id: "LIST" },
				"AdminStats",
				"AdminDistricts",
				"Districts",
				"Schools",
			],
		}),
	}),
});

export const {
	useGetDistrictsQuery,
	useGetSchoolsByDistrictQuery,
	useGetDataVersionQuery,
	useGetDataAllQuery,
	useLoginMutation,
	useLogoutMutation,
	useCheckDataExistsQuery,
	useUploadDataMutation,
	useGetAdminStatsQuery,
	useGetAdminDistrictsQuery,
	useGetAdminSchoolsQuery,
	useGetAdminSchoolQuery,
	useCreateSchoolMutation,
	useUpdateSchoolMutation,
	useDeleteSchoolMutation,
} = schoolsApi;
