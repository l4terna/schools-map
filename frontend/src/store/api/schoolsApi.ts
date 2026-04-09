import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { District, School, LoginPayload } from "@/types";

export const schoolsApi = createApi({
	reducerPath: "schoolsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API || ""}/api`,
		credentials: "include",
	}),
	tagTypes: ["Districts", "Schools", "Data"],
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

		uploadData: builder.mutation<{ status: string }, FormData>({
			query: (formData) => ({
				url: "/admin/data/upload",
				method: "POST",
				body: formData,
			}),
			invalidatesTags: ["Districts", "Schools", "Data"],
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
} = schoolsApi;
